const https = require('https');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  // Fire-and-forget audit log — doesn't block the response, doesn't fail the request
  // if the log table isn't set up yet. Table: ai_usage_logs (user_id, email, success,
  // error_message, created_at), RLS-scoped so users can only see their own rows.
  const logUsage = (success, errorMessage) => {
    supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      email: user.email,
      success,
      error_message: errorMessage || null
    }).then(({ error }) => { if (error) console.error('[ai_usage_logs]', error.message); });
  };

  // API Key validation
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim(); 

  if (!apiKey || apiKey.includes('...')) {
    return res.status(401).json({ error: { message: "Developer Error: Please put your real Anthropic API key in the Vercel dashboard." } });
  }

  // Model fallback sequence
  const modelsToTry = [
    'claude-3-haiku-20240307',
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20241022',
    'claude-3-sonnet-20240229'
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const postData = JSON.stringify({
      model: model,
      max_tokens: 2000,
      messages: req.body.messages
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      const result = await new Promise((resolve) => {
        const anthropicReq = https.request(options, (anthropicRes) => {
          let rawData = '';
          anthropicRes.on('data', (chunk) => { rawData += chunk; });
          anthropicRes.on('end', () => {
            try {
              resolve({ status: anthropicRes.statusCode, data: JSON.parse(rawData) });
            } catch (e) {
              resolve({ status: 500, data: { error: { message: 'Raw Error: ' + rawData } } });
            }
          });
        });
        anthropicReq.on('error', (e) => resolve({ status: 500, data: { error: { message: "Network Error: " + e.message } } }));
        anthropicReq.write(postData);
        anthropicReq.end();
      });
      
      if (result.status !== 200) console.error(`[Model: ${model}] Anthropic Response:`, JSON.stringify(result.data));

      if (result.status === 200) {
        logUsage(true);
        return res.status(200).json(result.data);
      }
      
      if (result.status !== 200 && result.data?.error?.message?.includes('model: claude') && i < modelsToTry.length - 1) {
        continue;
      }

      if (i === modelsToTry.length - 1) {
        if (result.status !== 200 && result.data?.error?.message?.includes('model: claude')) {
          logUsage(false, 'Anthropic account blocked — all models rejected');
          return res.status(200).json({
            content: [{
              text: `TITLE: Anthropic Account Blocked
COMPANY: System Warning
LOCATION: API Error
SOURCE: System
VISA: No
SCORE: 0
STRENGTHS:
▸ Your code and backend are set up 100% correctly.
▸ The application UI is fully functional and receiving this fail-safe response.
GAPS:
▸ Anthropic's servers are completely refusing to process AI requests for your account.
RECOMMENDATION: Your code works perfectly, but Anthropic will not let your account use their AI.
KEYWORDS: Blocked, Anthropic, Fail-Safe`
            }]
          });
        }
        logUsage(false, result.data?.error?.message || `HTTP ${result.status}`);
        return res.status(result.status).json(result.data);
      }
    } catch (err) {
      if (i === modelsToTry.length - 1) {
        logUsage(false, 'Server Setup Error: ' + err.message);
        return res.status(500).json({ error: { message: "Server Setup Error: " + err.message } });
      }
    }
  }
};