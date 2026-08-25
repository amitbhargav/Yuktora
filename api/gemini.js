const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Fallback AI proxy used when /api/anthropic is unavailable (e.g. out of
// credit balance). Same JWT gate and usage-logging as api/anthropic.js, and
// normalizes its response to the identical { content: [{ text }] } shape so
// the frontend's claude() helper doesn't need to know which provider answered.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // ==========================================
  // SECURITY GATE: Verify Supabase Session JWT
  // ==========================================
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized: Missing or malformed authorization token.' } });
  }
  const token = authHeader.split(' ')[1];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: { message: 'Server Configuration Error: Supabase keys missing on server.' } });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.authorization } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: { message: 'Unauthorized: Invalid or expired session.' } });
  }
  // ==========================================

  const logUsage = (success, errorMessage) => {
    supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      email: user.email,
      success,
      error_message: errorMessage || null
    }).then(({ error }) => { if (error) console.error('[ai_usage_logs]', error.message); });
  };

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(401).json({ error: { message: 'Developer Error: Please put your free Gemini API key in the Vercel dashboard as GEMINI_API_KEY (get one at aistudio.google.com).' } });
  }

  // The frontend sends Anthropic-Messages-shaped input ({ messages: [{role,
  // content}] }) — collapse it into Gemini's single-turn "contents" format.
  const userMessage = (req.body.messages || []).map(m => m.content).join('\n');
  const postData = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }]
  });

  // Free-tier model fallback, same retry-the-next-model pattern as api/anthropic.js.
  // Google renames/retires model IDs over time (gemini-1.5-flash has already
  // 404'd as "not found" for some keys) — trying several current + recent
  // names maximises the odds of hitting one this specific key can actually use.
  const modelsToTry = ['gemini-2.5-flash'];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      const result = await new Promise((resolve) => {
        const geminiReq = https.request(options, (geminiRes) => {
          let rawData = '';
          geminiRes.on('data', (chunk) => { rawData += chunk; });
          geminiRes.on('end', () => {
            try {
              resolve({ status: geminiRes.statusCode, data: JSON.parse(rawData) });
            } catch (e) {
              resolve({ status: 500, data: { error: { message: 'Raw Error: ' + rawData } } });
            }
          });
        });
        geminiReq.on('error', (e) => resolve({ status: 500, data: { error: { message: 'Network Error: ' + e.message } } }));
        geminiReq.write(postData);
        geminiReq.end();
      });

      if (result.status !== 200) console.error(`[Model: ${model}] Gemini Response:`, JSON.stringify(result.data));

      if (result.status === 200) {
        const text = (result.data?.candidates?.[0]?.content?.parts || []).map(p => p.text).join('');
        if (!text) {
          // 200 with no usable text (e.g. safety-filtered) — try the next model before giving up.
          if (i < modelsToTry.length - 1) continue;
          logUsage(false, 'Gemini returned no usable text (possibly safety-filtered)');
          return res.status(502).json({ error: { message: 'Gemini returned an empty response (it may have been safety-filtered). Try rephrasing.' } });
        }
        logUsage(true);
        return res.status(200).json({ content: [{ text }] });
      }

      if (i < modelsToTry.length - 1) continue; // try the next model on any non-200

      // Every model in the list failed — most likely this key/account doesn't
      // have access to any of them. Surface which ones were tried so it's
      // diagnosable without needing to read server logs.
      const triedList = modelsToTry.join(', ');
      const lastMessage = result.data?.error?.message || `HTTP ${result.status}`;
      logUsage(false, lastMessage);
      return res.status(result.status).json({
        error: { message: `${lastMessage} (tried: ${triedList} — check which models your Gemini API key supports at aistudio.google.com)` }
      });
    } catch (err) {
      if (i === modelsToTry.length - 1) {
        logUsage(false, 'Server Setup Error: ' + err.message);
        return res.status(500).json({ error: { message: 'Server Setup Error: ' + err.message } });
      }
    }
  }
};
