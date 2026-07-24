# Yuktora 🎯
Your AI job search co-pilot. Score jobs, tailor resumes, track every application. Built in Bengaluru.

Live: https://yuktora.vercel.app

---

## 🛠️ System Architecture & Tech Stack
* **Frontend:** Multi-page vanilla JS/HTML5/CSS3 (`index.html`, `signin.html`, `app.html`, `pricing.html`, `privacy.html`) with shared `styles.css`.
* **Hosting:** Vercel — auto-deploy from `main`, with serverless functions under `/api`.
* **AI Proxy:** `/api/anthropic` Vercel Function proxies Claude API calls using a server-side `ANTHROPIC_API_KEY`, gated behind a Supabase session JWT check. Users don't need their own key. Depends on `@supabase/supabase-js`, declared in `package.json`. A `/api/gemini` function also exists — pending audit to decide whether to keep both providers or consolidate.
* **Database & Auth:** Supabase (Mumbai region) — passwordless magic-link sign-in with RLS-scoped `user_profiles` and `tracked_jobs` tables.
* **Development:** VS Code + Cline extension.

---

## 📜 Project Milestones & Changelog

### Phase 1: Core Foundation
* **Monolithic Dashboard:** `app.html` holds main application state and job tracking.
* **Dynamic Config:** Client-side string replacement to securely wire up Supabase with anon keys.

### Phase 2: Security & Authentication
* **Decoupled Auth:** Moved authentication to `signin.html` to establish a secure perimeter.
* **Route Guards:** Session checks in `app.html`, forcing redirect for unauthenticated users.
* **Data Isolation:** RLS policies on `user_profiles` and `tracked_jobs`.

### Phase 3: Compliance & AI Interface
* **DPDP Compliance:** Mandatory privacy policy checkbox and validation logic on `signin.html`.
* **Security Hardening:** `escapeHTML` used instead of `.innerHTML` to prevent XSS.
* **AI Analytics UI:** Fit Meter, Keyword Gap Grid, and Resume Tailor Card built out on `app.html`.

### Phase 3.5: Auth Hardening & UX Polish
* **Session Persistence:** Fixed magic-link-every-visit bug. `signin.html` now checks `supabase.auth.getSession()` on load and redirects authenticated users to `/app` before rendering. Uses `detectSessionInUrl: true` for magic-link hash handling and `persistSession: true` for cross-session continuity.
* **Unified Auth Surface:** Removed the duplicate in-app auth gate from `app.html`. `/signin` is now the single source of truth for authentication. Route guard on `/app` redirects unauthenticated users cleanly.
* **Topbar Sign Out:** Moved Sign out from Settings into the app topbar, next to the signed-in email display. One visible, discoverable exit.
* **Magic Link UX:** Replaced browser `alert()` with inline success/error states. Success shows a green "Check your email" block with resend link; errors show inline red messaging with button reset so users can retry immediately.
* **Multi-Tab Sign Out:** `onAuthStateChange` listener on `/app` catches SIGNED_OUT events from other tabs and redirects in real time.
* **Marketing Copy Reconciled:** Homepage and app copy updated to reflect actual data model — Supabase-backed cloud sync with row-level security, not browser-only storage. "No API key required" positioning aligned with the existing `/api/anthropic` proxy.

### Phase 3.6: Infra Discovery
* **Confirmed `/api/anthropic` Vercel Function** is live in production with a server-side `ANTHROPIC_API_KEY`. This means Model B (server-proxied AI, no user BYOK) is technically deployed. Remaining work is metering + payment gate to distinguish Free from Pro usage.
* **Confirmed `/api/gemini` Vercel Function** also exists — pending audit to decide whether to keep both providers or consolidate.

### Phase 3.7: Public Demo Mode & Error Hardening (Shipped)
* **Frictionless Evaluation:** `?demo=1` query parameter on `/app` bypasses the Supabase auth guard, letting visitors explore the full dashboard UI instantly.
* **Safe Mock State & Fallbacks:** Configured a secure mock `supabaseClient` and strict validation fallbacks to prevent null-pointer crashes if unauthenticated users hit `/app` directly without credentials.
* **Demo Mode Banner:** Persistent visual indicator ("Viewing Yuktora Public Demo Mode — Sign in to save your own jobs") so demo state is unambiguous.
* **Favicon Integration:** Deployed `🎯` emoji favicon across all public and protected HTML pages (`index`, `signin`, `app`, `pricing`, `privacy`), eliminating persistent 404 network warnings.

### Phase 3.8: Mocha Marble Theme
* **Palette Overhaul:** Swapped `styles.css` `:root` block from the previous "Light & Bright" palette to Mocha Marble — warm chocolate ink (`#2B1E14`), deep chocolate brand (`#4A2C1A`), warm bronze accent (`#A8683A`), cream page surfaces (`#EFE8DD`).
* **Editorial Typography:** Added Fraunces serif for `--font-display` (headings), kept Outfit for `--font-body`. The italic serif on standout phrases like "unfair advantage" is the signature detail.
* **Warm-Tinted Shadows:** All box shadows retinted from cool navy to warm chocolate for palette coherence.
* **Sidebar as Chrome:** Dark walnut sidebar (`--ink` background) with warm oat/cream text against cream content areas — Linear/Vercel-style depth hierarchy.

### Phase 3.9: Secure AI Proxy — Full Auth Chain Fixed (Shipped)
* **Server-side JWT Gate:** `/api/anthropic` now verifies the caller's Supabase session JWT via `supabase.auth.getUser(token)` before proxying to Claude, closing the anonymous-call hole that public demo mode opened.
* **Frontend Wired Up:** `app.html`'s `claude()` helper fetches the live Supabase session and sends it as `Authorization: Bearer <token>` on every `/api/anthropic` call — previously the backend gate was live but the frontend never attached a token, so all AI calls (including signed-in users) were silently failing with 401.
* **Fixed Missing Client Config (root cause of the sign-in loop):** `app.html` referenced `SUPABASE_URL`/`SUPABASE_ANON_KEY` but never declared them — only `signin.html` did. Every visit to `/app` silently failed the config check and redirected straight back to `/signin`, regardless of session validity, which looked like a broken magic link but wasn't. Declared the same public anon-key constants in `app.html`.
* **Fixed Missing Dependency Manifest (root cause of the 500s):** the repo had no `package.json` anywhere in its history, so Vercel had nothing to install `@supabase/supabase-js` from — every `/api/anthropic` call crashed with `500 FUNCTION_INVOCATION_FAILED` at module load, before the JWT logic ever ran. Added `package.json` + `package-lock.json` declaring the dependency; verified via `npm install` and a live `curl` test (clean `401`s instead of a crash).
* **Graceful Demo Fallback:** Demo mode (`?demo=1`) has no real session, so AI calls now short-circuit client-side with a "Sign in to use AI features" toast instead of a raw network error, by design — demo visitors can explore the UI but can't spend the Anthropic budget.

---

## 🔮 Upcoming Roadmap

### Phase 4: Monetization & Backend Hardening
1. **Usage metering & persistent audit log** — write a row to a new Supabase table (user, timestamp, success/failure) on every `/api/anthropic` call. Enforces the Free tier daily limit at the proxy layer and gives a queryable history beyond Vercel's short-lived function logs and Supabase's own auth logs (both exist today but expire quickly on the free tier).
2. **Cashfree/Razorpay checkout** — wire Pro (₹499/mo) and Lifetime (₹6,999) buttons to actual payment flow; webhook updates `user_profiles.plan`.
3. **Retire BYOK for Anthropic** — remove the Settings API key input once metering is live. Keep the JSearch/RapidAPI input (that one is genuinely user-owned).

### Phase 5: Growth & Reliability
4. **Search Live fix** — reconcile localStorage key naming between Settings save and Search Live read; surface real JSearch API errors instead of silent demo fallback.
5. **Apply button URL validation** — prevent Chrome's "Blocked URL schema" error on demo/malformed job cards.
6. **Custom SMTP (Resend)** — replace default 2/hour Supabase mailer with production SMTP on a verified domain. Branded magic-link template. (Hit this limit firsthand while testing Phase 3.9 — worth prioritizing.)
7. **Error tracking** — Sentry free tier for post-launch monitoring.
8. **Theme polish pass** — resolve remaining sidebar wordmark and demo banner specificity issues, "+ Add job" button contrast check.

### Phase 6: Trust & Compliance
9. **Terms of Service + Refund Policy** pages — required by Indian payment gateway KYC.
10. **Complete DPDP consent audit** — verify checkbox, `escapeHTML`, and data-export/deletion flows meet requirements before scale.

---

## 🧭 Local Development

```bash
git clone [https://github.com/amitbhargav/Yuktora.git](https://github.com/amitbhargav/Yuktora.git)
cd Yuktora
# static files — no build step. Serve with any local HTTP server:
npx serve .