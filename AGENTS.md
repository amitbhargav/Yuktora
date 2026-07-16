# AI Agent Instructions for Yuktora

## Purpose
This file helps AI coding agents understand the Yuktora project theme and style conventions so they can make consistent design changes without introducing visual drift.

## Project overview
- Static marketing site for an AI job search co-pilot.
- Primary theme: light, clean SaaS design with burgundy/crimson brand accents, champagne gold highlights, and soft slate neutrals.
- Core stylesheet: `styles.css`.
- Additional theme tokens and component styles appear in `app.html`.
- No package manager or build system is required for the landing pages; pages are plain HTML/CSS with optional Vercel serverless APIs under `api/`.

## Theme guidance
- Prefer existing CSS variables and tokens over hard-coded colors.
- Keep new components aligned with the current brand palette and motion system.
- Use shared utility classes like `.container`, `.section`, `.section-sm`, `.card`, `.btn`, and `.badge`.
- Maintain the existing rounded geometry, subtle shadows, and light background surfaces.

### Key design tokens
- Backgrounds / surfaces: `--cream`, `--cream-2`, `--cream-3`, `--cream-4`
- Brand burgundy: `--burg`, `--burg-2`, `--burg-3`, `--burg-light`, `--burg-soft`, `--burg-mid`
- Accent gold: `--gold`, `--gold-2`, `--gold-soft`, `--gold-mid`
- Neutrals / text: `--ink`, `--ink-2`, `--ink-3`, `--ink-4`
- Borders / shadows: `--border`, `--border-2`, `--border-burg`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-lg`
- Typography: `--font-display`, `--font-body`, `--font-mono`

### Brand classes
- Primary buttons: `.btn-burg`, `.btn-gold`
- Secondary buttons: `.btn-outline`, `.btn-cream`, `.btn-ghost`
- Accent text: `.text-burg`, `.text-gold`
- Cards: `.card`
- Badges: `.badge-burg`, `.badge-gold`, `.badge-cream`, `.badge-green`
- Rule accents: `.rule-gold`, `.rule-burg`

## HTML / component conventions
- Hero areas use `background: var(--cream)` with gradient accent borders and soft radial texturing.
- Section padding is generally `96px 0` or `64px 0` for smaller sections.
- Navigation is fixed and translucent with a bottom border in the landing pages.
- Footer uses a dark burgundy surface and gold border for contrast.

## When updating the theme
- Add new color usage only through CSS variables in `styles.css` whenever possible.
- Reuse the same font families and spacing scale.
- Avoid introducing a second visual theme outside the existing light/burgundy/gold palette.
- Use responsive breakpoints already defined at `max-width: 768px` and `max-width: 480px`.

## Files to inspect for style consistency
- `styles.css` — primary theme and component styles.
- `app.html` — alternate admin/dashboard theme tokens and component patterns.
- `index.html`, `blog.html`, `pricing.html`, `signin.html` — examples of how the landing page theme is applied.

---

## 🏗️ Technical Architecture

Yuktora is engineered for maximum speed and zero build-overhead:

- **Frontend Core:** Pure Vanilla JavaScript + Semantic HTML5 + Vanilla CSS. The entire application UI lives inside `app.html` as a monolithic single-workspace layout.
- **Cloud Database Backend:** Supabase (PostgreSQL instance hosted in Mumbai, Asia South region).
- **Deployment Platform:** Vercel (Edge network static delivery hosting).
- **AI Intelligence Layer:** Anthropic Claude API via secure serverless proxies in `api/anthropic.js` and `api/gemini.js`.

---

## ⚡ Cloud Sync Architecture (Supabase Integration)

`app.html` includes a full Supabase cloud synchronization engine. Key implementation details:

### SDK
The official Supabase JS SDK v2 is loaded via jsDelivr CDN in `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

### Client Initialization
A global `supabaseClient` is initialized at the top of the main `<script>` tag using hardcoded public anon credentials targeting the live Mumbai production cluster:
```js
const SUPABASE_URL      = 'https://qflgxfqoldrxvchogkkj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabaseClient    = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Cloud Sync Functions
- `saveToSupabase(email)` — upserts `S.profile` into `user_profiles`, deletes stale rows, and inserts `S.apps` into `tracked_jobs`.
- `fetchFromSupabase(email)` — pulls profile + jobs from Supabase, merges into `S`, calls `persist()`, and re-renders `renderDash()`, `renderTracker()`, `loadProfile()`.
- `cloudSave()` / `cloudLoad()` — topbar button wrappers that read the email from `S.profile.email`.

### Topbar UI Buttons
Two buttons are present in the `.topbar-right` area:
- `💾 Save to Cloud` (`#btn-save-cloud`, `.btn-green`) — calls `cloudSave()`
- `🔄 Load Data` (`#btn-load-cloud`, `.btn-secondary`) — calls `cloudLoad()`

---

## 🗄️ Relational Database Schema

Row Level Security (RLS) is enabled on all tables. Public insert/update/select policies allow the browser client to manage its own rows safely.

```sql
-- Core User Metadata Table
CREATE TABLE public.user_profiles (
  email        TEXT PRIMARY KEY,
  resume       TEXT,
  profile_json JSONB,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Interlinked Job Pipeline Tracking Table
CREATE TABLE public.tracked_jobs (
  id         BIGINT PRIMARY KEY,
  email      TEXT REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  title      TEXT,
  company    TEXT,
  loc        TEXT,
  platform   TEXT,
  status     TEXT,
  score      INT,
  url        TEXT,
  visa       BOOLEAN,
  notes      TEXT,
  date       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🗺️ State Object Reference (`S`)

The global state object in `app.html` maps directly to the database schema:

| `S` field | Supabase table | Column |
|---|---|---|
| `S.profile.email` | `user_profiles` | `email` (PK / row key) |
| `S.profile.resume` | `user_profiles` | `resume` |
| `S.profile.*` | `user_profiles` | `profile_json` (full JSONB) |
| `S.apps[]` | `tracked_jobs` | one row per application |

---

## Notes for agents
- Focus theme edits in CSS and HTML only; backend API files in `api/` are unrelated to visual theme updates.
- Keep content structure stable: the site is mostly static and does not use a JS build tool.
- Do not create a separate dark theme unless explicitly requested.
- The `api/app.js` serverless proxy has been deleted. `app.html` is served as a plain static file — do not recreate the proxy unless explicitly asked.
- The Supabase anon key in `app.html` is the **public** anon key — it is safe to commit and is intentionally hardcoded for a zero-build static deployment.
