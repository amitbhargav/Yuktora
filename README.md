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

### Phase 3.13: Theme Polish — Found Where the Contrast Fixes Actually Belonged (Shipped)
* **`app.html` doesn't load `styles.css` at all** — it has its own fully separate embedded `<style>` block. Every prior "fix(theme): sidebar wordmark, api-pill, contrast" commit (5+ of them) edited `styles.css`, which only affects the marketing pages (`index.html`, `pricing.html`, `blog.html`, `signin.html`); none of those fixes ever touched the actual dashboard.
* **First pass got the diagnosis half-right:** `.brand-name`/`.api-pill` set `color: var(--white)`, and the *first* `.sidebar` rule in the file sets `background: var(--white)` — that alone looked like white-on-white. But a second `.sidebar` rule further down (part of a pasted-in "Mocha Marble" block, `!important`, dark walnut `#2b1e14`) actually wins and is what renders. So the sidebar is dark, `var(--white)` text on it was correct all along, and changing it to `var(--brand)`/`var(--gray-500)` in the first attempt made it dark-on-dark instead. Reverted `.brand-name`/`.api-pill` back to `var(--white)`.
* **Cleaned up the actual mess that caused the confusion:** the pasted-in Mocha Marble block had a stray HTML comment (`<!-- ... -->`) sitting mid-CSS instead of a `/* */` comment, and the entire "dark walnut sidebar as chrome" rule set was duplicated twice back-to-back, byte-for-byte. Fixed the comment syntax and removed the duplicate — same visual result, one copy instead of two.
* **Demo banner recolored:** the banner is generated in JS with a hardcoded inline `style.cssText`, so no external stylesheet rule (from either `styles.css` or `app.html`'s own block) could ever reach it. Changed the inline style directly from hardcoded blue (`#2563eb`) to `var(--brand)`, matching the app's actual theme tokens.
* **"+Add job" button checked, not touched:** `.btn-primary` already has correct dark-background/white-text contrast — the roadmap concern didn't reproduce.
* Note for future theme work: `styles.css`'s `.sidebar`/`.demo-banner`/`aside` rules are still dead code as far as `app.html` is concerned — harmless, still styles the marketing pages, but don't debug dashboard contrast there.

### Phase 3.14: Site-Wide Audit — Recruiter Leads, Dead Links, Pricing Honesty (Shipped)
* **Recruiter lead form was silently losing every submission (critical, pre-existing):** `submitRecruiter()` posted to a Formspree endpoint that 404s — that form doesn't exist. The error was caught and swallowed, and the success message showed unconditionally regardless of whether anything was actually sent. The only other write was to the *visitor's own* `localStorage`, invisible to us. Replaced with a direct Supabase insert into a new `recruiter_leads` table (public insert-only RLS policy — visible to us via the Table Editor, not readable via the API). On failure, the form now shows a real error with a `mailto:` fallback instead of a fake success. **Needs the same one-time SQL step as `ai_usage_logs`** — see `AGENTS.md`.
* **Removed the dead "Platforms" nav link** (`pricing.html`, `blog.html`) — pointed at `/#platforms`, a section that has never existed on `index.html`.
* **Removed the false "Secure via Cashfree" trust badge** on the pricing page — Cashfree/Razorpay isn't integrated yet (see Phase 4.3 below); the badge was claiming a live capability that doesn't exist. Replaced with "Cancel anytime · No hidden fees."
* **Added a "Try Demo" nav link** (`/app?demo=1`) alongside Sign in / Launch App on `index.html`, `pricing.html`, and `blog.html` — previously every CTA required a real account before a visitor could see the product.
* **Confirmed, not fixed — pricing plans are currently non-functional:** "Get Started Free," "Upgrade to Pro," and "Get Lifetime" all link to the same `/app` with zero differentiation. The only Free/Pro gate anywhere in the code is a client-side, lifetime (not daily) 5-use counter — trivially reset by clearing browser storage — and there is currently no way to actually obtain a `pro_` license key. "AI job matching (better fit roles)" listed as Pro-exclusive isn't actually differentiated in code; matching runs identically for everyone. This is what Phase 4.1–4.3 below need to actually resolve.
* **Also noticed, not fixed:** the yearly Pro price (₹3,499) is ~42% off monthly (₹499×12=₹5,988), not the "Save 30%" the toggle badge claims. Left as-is pending a decision on which number is authoritative — flagging here so it doesn't get missed.

### Phase 3.15: Recruiter-Side Hidden Pending Manual Validation (Shipped)
* **Strategic context:** considered positioning Yuktora toward a specific niche — candidates with 10+ years of experience in technical leadership roles (Engineering Manager/Director, Staff/Principal Engineer, Senior/Principal TPM, Senior PM/VP Product) — plus a recruiter-facing candidate-search feature to match. Reasoned through it before building: senior candidates search differently than the product's current core loop assumes (few high-intent moves via referral/inbound, not high-volume apply-and-track), and the recruiter side has a classic two-sided-marketplace cold-start problem (recruiters won't pay to search an empty pool; candidates won't opt into a pool with no recruiter demand) plus a real trust/verification gap against what recruiters already pay for (LinkedIn Recruiter, agency relationships). A recruiter-search feature would also expand the DPDP compliance surface — candidate data becoming visible to third parties needs explicit opt-in/visibility controls, not just today's self-service-only posture.
* **Decision:** validate cheaply before building anything. Hid all recruiter-facing UI (nav links, the `#hire` landing section, the pricing page recruiter banner) from `index.html`, `pricing.html`, `blog.html` — full markup preserved in git history, not deleted from the record, so it's a quick restore if/when revisited (here, or as a separate portal). The `recruiter_leads` Supabase table/migration from Phase 3.14 is now on hold, not urgent, since the form that would write to it is no longer live.
* **Next step, not yet started:** test the senior-candidate positioning hypothesis on copy alone first (no product/mechanic changes) — reword existing candidate-facing marketing toward that audience's actual pain points and see whether it changes signup quality/engagement before committing to any deeper AI-scoring or product rebuild.

### Phase 3.16: "Ask AI" Guide Redesign — Trimmed Flow, Docked Panel, Deep-Linked Demo (Shipped)
* **Problem being solved:** the guide (`yuktora-bot.js`/`yuktora-bot.css`, included on every page) auto-opened full-screen for every first-time visitor and asked three sequential questions (pain point → India/international → tracking method) before showing anything. Reopening it later via the "Ask AI" launcher replayed the same full-screen takeover every time, even for returning visitors who already knew the product.
* **One question, not three:** trimmed the marketing flow to a single "what's slowing your search down?" pick, which now goes straight to a recommendation. The India/international and tracking-method content wasn't deleted — it moved into the free-text FAQ (`YB_FAQ`), answerable on request instead of gating everyone upfront.
* **Two display modes instead of one:** added an `'onboard'` vs `'panel'` mode to `ybOpen()`. The full-screen treatment now fires automatically exactly once per visitor (first visit only, via the existing `yuktora_bot_seen` localStorage flag) — every subsequent open, including every manual "Ask AI" click, opens as a compact 380px docked panel anchored above the launcher instead, so the page underneath stays visible and usable. Below 640px it stays full-screen in both modes, since a small docked panel doesn't work at that size — that's `.yb-panel`'s media-query scope, not an oversight.
* **Recommendation cards now deep-link into the live tool, not just a homepage scroll:** added `?tab=` query-param support to `app.html`'s existing `?demo=1` bypass (`applyDeepLinkTab()`, called after shell boot in both the demo and authenticated init paths), so `/app.html?demo=1&tab=rejection` (etc.) opens straight into that specific tool with no sign-in required. Each pain-point card now offers "Try [Feature]" (primary — jumps into the live tool) alongside "Learn more first" (secondary — scrolls to that feature's section on the homepage, for people who want context before diving in).
* **Avatar replaced, not just restyled:** the illustrated portrait face (hand-drawn eyes/brows/mouth/hair) was reported as reading like an unsettling grin at small sizes. Replaced entirely with a two-sparkle mark on the same warm orb background — no face, no expression to misread, same signature-element idea used by other AI product marks. Applied identically across all 6 pages that embed it (`index.html`, `app.html`, `pricing.html`, `signin.html`, `blog.html`, `404.html`).
* **Fixed two real specificity collisions with `app.html`'s own theme CSS** (marketing pages were never affected — this only reproduced inside the dashboard): `app.html` has a `[class*="eyebrow"]` substring selector for its own "BUILT WITH YUKTORA INTELLIGENCE" badge, which was also matching the guide's `.yb-eyebrow2` status line and silently applying its light-tan badge background under the guide's light-cream text — unreadable until manually text-selected. Separately, `app.html`'s `input[type="text"]` rule (an attribute selector, which outranks a plain class in CSS specificity regardless of load order) was overriding the FAQ input's background to white, so light text landed on a white box. Fixed by scoping both rules under the `#ybOverlay` ID, which now safely outranks either collision.
* **Not changed:** `styles.css`, `api/`, `package.json`, all Supabase/payment/auth logic — this phase only touched `yuktora-bot.js`, `yuktora-bot.css`, `app.html` (deep-link support only), and one SVG path repeated across the 6 HTML pages.

### Phase 3.17: Base Resume Upload — PDF Parsing, Single Source of Truth (Shipped)
* **Problem being solved:** the resume lived as two separate paste-in-a-textarea fields — one in My Profile, one duplicated on the Resume Tailor page — with no way to upload an actual resume file. First of a 4-part daily-use UX pass (see Phase 3.18 below for the rest).
* **Client-side PDF parsing, zero backend change:** added a file input to the "Base resume" card in My Profile. Selecting a PDF extracts its text entirely in-browser via PDF.js (loaded from CDN, same pattern as the existing Supabase JS SDK `<script>` tag) — the file itself never leaves the browser or touches `api/`, `package.json`, or the auth chain. The extracted text fills the existing resume textarea, still editable by hand, and still saves through the existing `saveProfile()` → `persist()` → "Save to Cloud" flow into the existing `user_profiles.resume` column. No new SQL migration, no new Supabase Storage bucket — deliberately kept to text-only for now.
* **Removed the duplicate paste field:** the Resume Tailor page's own resume textarea (`#t-resume`) is gone. `tailorResume()` now reads directly from `S.profile.resume`, and the page shows a read-only preview with a link back to My Profile if you need to update it — one source of truth instead of two fields that could drift out of sync.
* **Verified with a real headless-browser run** (Playwright against the local static server): uploaded a sample PDF, confirmed extracted text landed in the profile textarea, confirmed Save Profile propagated it into the Resume Tailor preview, zero console errors.

### Phase 3.18: Visa Sponsorship Detection Accuracy (Shipped)
* **The bug:** `fetchLiveJobs()` flagged a job as visa-sponsored (🌍 badge, folded into the fit score) whenever the word "visa" appeared *anywhere* in the JD text — including inside explicit non-sponsorship statements. A real example caught in testing: a KPMG posting stating "*KPMG LLP will not sponsor applicants for U.S. work visa status... no sponsorship is available for H-1B, L-1...*" was shown as a confirmed-sponsored 100% match.
* **Fix:** replaced the substring check with `detectVisaSponsorship()` — requires an explicit positive statement ("will sponsor", "sponsorship available", etc.); negation ("will not sponsor", "unable to sponsor") or plain silence both resolve to *unconfirmed*, never assumed true. Verified against the exact KPMG text plus 11 other scenarios via unit tests.
* **Stronger than a badge fix — international jobs are hidden, not just unbadged:** added `isAbroadJob()`, comparing the job's country against the candidate's profile location (skipping remote roles, and any case with insufficient location data, to avoid over-filtering). A job outside the candidate's country with unconfirmed sponsorship no longer appears in Job Search results at all; the "Analysed jobs" summary now reports how many were hidden and why (e.g. "2 hidden — no visa sponsorship confirmed").
* **Country matching is deliberately conservative:** only resolves a location's country when it matches a known-country whitelist — a bare city name like "Bangalore" (no country suffix) never gets treated as an unrecognised "country" that would false-positive as abroad against "India".

### Phase 3.19: Resume Upload UX Refinement — Collapsed Text, DOCX Support (Shipped)
* **Problem:** Phase 3.17 shipped the resume textarea always visible, even after a successful upload — a full 14-row box sitting there with parsed text dumped into it wasn't the "upload and done" experience wanted.
* **Collapsed by default, everywhere:** the Base resume card now shows a one-line summary ("Resume saved — N characters ✓") plus a small "Edit extracted text" link that reveals the box only on request. It re-collapses every time the Profile page is (re)loaded — no lingering open state. Users without a file to upload get the same link labelled "Paste resume text manually instead."
* **DOCX support added alongside PDF:** Mammoth.js via CDN, same client-side-only pattern as the existing PDF.js integration — the file input now accepts either format, nothing uploaded to any backend.
* **Verified with a headless-browser run:** uploaded both a sample PDF and DOCX, confirmed extraction, save, and the collapse/toggle/re-collapse-on-revisit behavior, zero console errors.

### Phase 3.20: Visa Detection Follow-up — Region Recognition, Live Rescoring (Shipped)
* **Location detection was too narrow:** Phase 3.18's `isAbroadJob()` only recognised specific country names — a JSearch result location like `"europe"` (a region, not a country) didn't resolve to anything, so the abroad-hiding check silently skipped it and the job slipped through unfiltered. `KNOWN_LOCATIONS` now also recognises broad regions (Europe, EMEA, APAC, Middle East, Gulf, North America, LatAm, etc.) as distinct from a candidate's home country.
* **New signal — JD text can require local eligibility without ever saying "visa" or "sponsor":** added `requiresLocalWorkAuthorization()`, matching phrasing like "must have EU work eligibility" or "right to work in the UK required." `jobNeedsHiding()` now hides a job if *either* it's abroad with unconfirmed sponsorship, *or* the JD demands pre-existing local work rights — confirmed sponsorship always overrides both.
* **Fixed the "match breakdown looks broken" bug:** live-fetched jobs were scored once at fetch time and frozen forever — a job scored 100% purely on title match (because the profile had zero skills configured *at that moment*) stayed frozen at 100% with an unhelpful "Skills not found: none flagged" breakdown even after skills were added later. Added `rescoreHeuristicJobs()`, which recomputes score, visa status, and the breakdown text against the *current* profile on every render — tagged only onto heuristic-scored jobs (`scoreSource: 'heuristic'`); AI-scored jobs from Paste JD are left alone since re-scoring those would cost a real Claude call. `matchBreakdown()` also now explicitly says "No skills set in your profile yet" instead of the ambiguous "none flagged" when the profile has zero skills.
* **Verified** with 12 unit tests (including the exact "europe"-location and "EU work eligibility" scenarios reported) plus a live headless-browser run reproducing the full before/after: a stale 100%-match "europe" job with no confirmed sponsorship gets hidden, then reappears with a live-recalculated score once the JD confirms sponsorship and a matching skill is added to the profile.

### Phase 3.21: Free-Tier AI Fallback — Gemini (Shipped)
* **Problem:** `/api/anthropic` is the only AI backend, gated on a paid Anthropic account's credit balance — when that balance hits zero, every AI feature (Resume Tailor, Analyse & Score, Rejection AI) fails outright with Anthropic's raw billing error.
* **Built out `api/gemini.js`** (previously an empty stub left for this exact purpose — see Phase 3.6): same Supabase JWT gate and `ai_usage_logs` logging as `api/anthropic.js`, calling Google's free-tier Gemini API (`gemini-2.0-flash` → `gemini-1.5-flash` fallback). Its response is normalized to the identical `{ content: [{ text }] }` shape `api/anthropic.js` returns, so nothing downstream needs to know which provider actually answered.
* **Frontend `claude()` now tries both, in order:** Anthropic first (generally the stronger model), automatically falling back to Gemini on any failure — a bad response, a network error, or a billing block. If both fail, the surfaced error includes both providers' reasons, not just the first one, so nothing gets silently swallowed.
* **Requires a one-time manual step** (same pattern as `ai_usage_logs`/`recruiter_leads`): get a free key at aistudio.google.com (no credit card required) and add it to Vercel as `GEMINI_API_KEY`, then redeploy so the serverless functions pick it up.
* **Verified** with isolated fallback-chain tests (Anthropic succeeds / Anthropic fails+Gemini succeeds / both fail with combined error / Anthropic network error+Gemini succeeds) and a response-shape check against a realistic Gemini API payload — all passing. Not verified against a live Gemini key/quota, since none exists in this environment; recommend a real end-to-end check once `GEMINI_API_KEY` is set.

---

## 🔮 Upcoming Roadmap

### Phase 3.22: Daily-Use UX Pass (remaining)
Parts 2–4 of the same initiative that started with Phase 3.17 — aimed at turning Yuktora from "a product I built" into a tool used daily.
1. **Auto-parse skills from resume** — when the base resume is uploaded/updated, call Claude to extract a skills list and prefill the Skills chips in My Profile (still editable, add/remove as normal). Depends on Phase 3.17's saved resume text.
2. **Job matching threshold on Job Search** — show 80%+ Fit Score matches by default, with a "Show close matches (60–79%)" toggle for the rest, visually de-emphasised. Independent of the other three items.
3. **One-click Resume Tailor from job cards** — a "Tailor for this role" button per job card that pulls the saved base resume + that job's JD and runs the tailor directly, skipping the Resume Tailor page's form. Depends on Phase 3.17's saved resume; touches the same job-card markup as item 2 above, so sequenced after it.

### Phase 4: Monetization & Backend Hardening
1. **Run the `ai_usage_logs` migration** — shipped in code (Phase 3.11) but needs its table created via Supabase's SQL Editor (see `AGENTS.md`). Quick, one-time, GUI step. (`recruiter_leads` migration from Phase 3.14 is on hold — see Phase 3.15.)
2. **Free-tier quota enforcement at the proxy layer** — once `ai_usage_logs` exists and has data, enforce the daily AI-call limit server-side instead of relying on the client-side `localStorage` counter alone (which a user can bypass by clearing storage). *Blocked on: item 3 below — real enforcement needs a server-verifiable Free/Pro distinction, which doesn't exist until the payment webhook writes `user_profiles.plan`.*
3. **Razorpay checkout** — wire Pro (₹499/mo) and Lifetime (₹6,999) buttons to an actual payment flow; webhook updates `user_profiles.plan`. Chosen over Cashfree for stronger Node.js docs/ecosystem and a mature Subscriptions API that maps directly to the recurring Pro plan. *Blocked on: Test Mode API keys (no KYC needed for sandbox — just signup), then full KYC before going live.*
4. **Retire BYOK for Anthropic** — remove the Settings API key input once metering is live. Keep the JSearch/RapidAPI input (that one is genuinely user-owned). *Blocked on: items 2 and 3.*
5. **Decide the real feature split** — before or alongside the checkout build, settle what's *actually* different about Pro/Lifetime (today: only the AI-use cap) so the pricing page stops overpromising. Candidates already flagged above: real AI job-matching differentiation, correcting the yearly discount math, and whether the senior-candidate positioning (Phase 3.15) changes this.

### Phase 5: Growth & Reliability
6. **Custom SMTP (Resend)** — replace default 2/hour Supabase mailer with production SMTP on a verified domain. Branded magic-link template. (Hit this limit firsthand while testing Phase 3.9 — worth prioritizing.) *Blocked on: Resend account signup + domain DNS verification.*
7. **Error tracking** — Sentry free tier for post-launch monitoring. *Blocked on: Sentry account signup + DSN.*

### Phase 6: Trust & Compliance
8. **DPDP data-export flow** — the escapeHTML and data-erasure gaps from the original audit item are fixed (Phase 3.12); still open is a proper data-*export* flow (the existing "Export" button dumps local `S` state as JSON, not a formal Supabase-backed export) if that's required for compliance at scale.

---

## 🧭 Local Development

```bash
git clone [https://github.com/amitbhargav/Yuktora.git](https://github.com/amitbhargav/Yuktora.git)
cd Yuktora
# static files — no build step. Serve with any local HTTP server:
npx serve .