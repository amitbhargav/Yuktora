const fs   = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // ── Read the static app.html from the project root ──────────────────────
  const filePath = path.join(process.cwd(), 'app.html');

  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('[api/app.js] Could not read app.html:', err.message);
    return res.status(500).send('Internal Server Error: could not load app.html');
  }

  // ── Inject real Supabase credentials from Vercel environment variables ───
  // Set SUPABASE_URL and SUPABASE_ANON_KEY in your Vercel project dashboard
  // under Settings → Environment Variables. They are never exposed in source.
  const supabaseUrl     = process.env.SUPABASE_URL      || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  // Inject credentials via a <script> block prepended to <head>.
  // This sets window.ENV_SUPABASE_URL and window.ENV_SUPABASE_ANON_KEY before
  // any other script runs, so the supabase.createClient() call in app.html
  // always picks up the real values regardless of placeholder string format.
  const injectedScript = `<script>
  window.ENV_SUPABASE_URL = '${supabaseUrl}';
  window.ENV_SUPABASE_ANON_KEY = '${supabaseAnonKey}';
<\/script>`;

  html = html.replace('<head>', `<head>\n${injectedScript}`);

  // ── Return the modified HTML ─────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Prevent the browser from caching a page that contains injected secrets
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html);
};
