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

### Phase 3.10: Search Live Error Surfacing (Shipped)
* **Real JSearch Errors Surfaced:** `fetchLiveJobs()` previously threw a hardcoded `"API Error - Check your key or quota"` on any failed live search and showed the same generic toast regardless of cause. Now parses the actual JSearch/RapidAPI error body and distinguishes invalid-key (401/403) from rate-limit/quota (429) from other failures, so the toast tells you what actually went wrong.
* **"localStorage naming mismatch" claim retired:** audited the full git history of the `rapid_key` storage key used by `saveRapidKey()` and `fetchLiveJobs()` — it has been consistently named in every commit that ever touched it. The originally-roadmapped "reconcile localStorage key naming" bug does not reproduce in the current code; removed from the roadmap rather than carried forward.
* **Apply button URL validation confirmed already in place:** `applyNow()` already validates the URL protocol via `new URL()`, whitelists `http:`/`https:`, and shows a friendly toast on anything else — the roadmapped "prevent Chrome's Blocked URL schema error" concern was already handled by existing code. No change needed.

### Phase 3.11: AI Usage Audit Log (Shipped — needs one-time DB setup)
* **Every `/api/anthropic` call now logs an outcome:** after the JWT gate passes, the proxy fire-and-forget writes a row to a new `ai_usage_logs` table (`user_id`, `email`, `success`, `error_message`, `created_at`) — RLS-scoped so each user can only see their own history. This is the persistent audit trail discussed for Phase 4.1; Free-tier quota *enforcement* is still pending (needs a `user_profiles.plan` column that doesn't exist until the payment integration lands).
* **Requires a manual one-time step:** the table + RLS policies aren't created automatically — run the SQL in `AGENTS.md`'s schema reference once via Supabase's SQL Editor. Until then the insert calls fail silently (logged to Vercel's console only) and don't block or break AI calls.

### Phase 3.12: DPDP Audit — escapeHTML Gaps + Real Data Erasure (Shipped)
* **Closed escapeHTML gaps:** the applications tracker table, dashboard "recent applications" and "top sources" widgets, rejection-analysis panel, and profile tag chips were all rendering user-typed or externally-sourced (JSearch) text via raw `innerHTML` without escaping — inconsistent with the Phase 3 "Security Hardening" claim, which only covered some views (e.g. the Saved Jobs list already did this correctly). Now consistently escaped everywhere the same data is displayed.
* **Hardened the Apply-URL onclick handler:** table-row Apply buttons interpolated a raw job URL directly into an inline `onclick` attribute — HTML-escaping alone doesn't protect this, because event-handler attribute values are HTML-decoded *before* being parsed as JS, so an escaped quote can still break out of the handler's own string literal. Now routes through the existing (previously unused) `sanitizeApplyURL()` protocol whitelist plus a quote strip.
* **"Clear all data" now actually clears data:** `wipeData()` previously only cleared `localStorage`, leaving the Supabase-stored profile and tracked-jobs rows for that email fully intact — a right-to-erasure gap for a button that told the user their data was wiped. Now also deletes both tables' rows for the user's email before clearing local state.
* **Consent checkbox verified, not touched:** `signin.html`'s mandatory privacy-policy checkbox (disables Send until checked, plus a hard block on submit) was re-checked and still functions correctly — no regression, no change needed.

---

## 🔮 Upcoming Roadmap

### Phase 4: Monetization & Backend Hardening
1. **Run the `ai_usage_logs` migration** — the audit-log code shipped in Phase 3.11, but the table itself still needs to be created via Supabase's SQL Editor (see `AGENTS.md`). Quick, one-time, GUI step.
2. **Free-tier quota enforcement at the proxy layer** — once `ai_usage_logs` exists and has data, enforce the daily AI-call limit server-side instead of relying on the client-side `localStorage` counter alone (which a user can bypass by clearing storage).
3. **Cashfree/Razorpay checkout** — wire Pro (₹499/mo) and Lifetime (₹6,999) buttons to actual payment flow; webhook updates `user_profiles.plan`.
4. **Retire BYOK for Anthropic** — remove the Settings API key input once metering is live. Keep the JSearch/RapidAPI input (that one is genuinely user-owned).

### Phase 5: Growth & Reliability
5. **Custom SMTP (Resend)** — replace default 2/hour Supabase mailer with production SMTP on a verified domain. Branded magic-link template. (Hit this limit firsthand while testing Phase 3.9 — worth prioritizing.)
6. **Error tracking** — Sentry free tier for post-launch monitoring.
7. **Theme polish pass** — resolve remaining sidebar wordmark and demo banner specificity issues, "+ Add job" button contrast check.

### Phase 6: Trust & Compliance
8. **Terms of Service + Refund Policy** pages — required by Indian payment gateway KYC.
9. **DPDP data-export flow** — the escapeHTML and data-erasure gaps from the original audit item are fixed (Phase 3.12); still open is a proper data-*export* flow (the existing "Export" button dumps local `S` state as JSON, not a formal Supabase-backed export) if that's required for compliance at scale.

---

## 🧭 Local Development

```bash
git clone [https://github.com/amitbhargav/Yuktora.git](https://github.com/amitbhargav/Yuktora.git)
cd Yuktora
# static files — no build step. Serve with any local HTTP server:
npx serve .