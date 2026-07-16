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

  // Inject credentials via a <script> block that replaces the opening <head> tag.
  // window.ENV_SUPABASE_URL and window.ENV_SUPABASE_ANON_KEY are set before any
  // other script runs, so supabase.createClient() in app.html always gets the
  // real values from Vercel environment variables.
  const scriptInjection = `<head>
<script>
  window.ENV_SUPABASE_URL = "${process.env.SUPABASE_URL}";
  window.ENV_SUPABASE_ANON_KEY = "${process.env.SUPABASE_ANON_KEY}";
<\/script>`;

  html = html.replace('<head>', scriptInjection);

  // ── Return the modified HTML ─────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Prevent the browser from caching a page that contains injected secrets
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html);
};
