# Yuktora 🎯
Your AI job search co-pilot. Score jobs, tailor resumes, track every application. Built in Bengaluru.

Live: https://yuktora.vercel.app

---

## 🛠️ System Architecture & Tech Stack
* **Frontend:** Multi-page vanilla JS/HTML5/CSS3 (`index.html`, `signin.html`, `app.html`, `pricing.html`, `privacy.html`).
* **Hosting:** Vercel — auto-deploy from `main`, with serverless functions under `/api`.
* **AI Proxy:** `/api/anthropic` Vercel Function proxies Claude API calls using a server-side `ANTHROPIC_API_KEY`. Users don't need their own key.
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

### Phase 3.6: Discovery — Existing Infra
* **Confirmed `/api/anthropic` Vercel Function** is live in production with a server-side `ANTHROPIC_API_KEY`. This means Model B (server-proxied AI, no user BYOK) is technically deployed. Remaining work is metering + payment gate to distinguish Free from Pro usage.

---

## 🔮 Upcoming Roadmap

### Phase 4: Monetization & Backend Hardening
1. **Server-side auth on `/api/anthropic`** — verify Supabase JWT before proxying to Claude. Prevents anonymous calls draining the Anthropic bill.
2. **Usage metering** — track AI calls per user in Supabase. Enforce Free tier limit (e.g. 3 tailors/day) at the proxy layer.
3. **Cashfree/Razorpay checkout** — wire Pro (₹499/mo) and Lifetime (₹6,999) buttons to actual payment flow; webhook updates `user_profiles.plan`.
4. **Retire BYOK for Anthropic** — remove the Settings API key input once metering is live. Keep the JSearch/RapidAPI input (that one is genuinely user-owned).

### Phase 5: Growth & Reliability
5. **Public demo mode** — `/app?demo=1` loads a curated fake dataset without auth. Canned AI responses instead of live proxy calls (protects Anthropic bill). Marketing homepage links to it.
6. **Custom SMTP (Resend)** — replace default 2/hour Supabase mailer with production SMTP on a verified domain. Branded magic-link template.
7. **Search Live fix** — reconcile localStorage key naming, surface real JSearch API errors instead of silent demo fallback.
8. **Apply button URL validation** — prevent Chrome's "Blocked URL schema" error on demo/malformed job cards.
9. **Error tracking** — Sentry free tier for post-launch monitoring.

### Phase 6: Trust & Compliance
10. **Terms of Service + Refund Policy** pages — required by Indian payment gateway KYC.
11. **Complete DPDP consent audit** — verify checkbox, `escapeHTML`, and data-export/deletion flows meet requirements before scale.

---

## 🧭 Local Development

```bash
git clone https://github.com/amitbhargav/Yuktora.git
cd Yuktora
# static files — no build step. Serve with any local HTTP server:
npx serve .
```

Environment variables (set in Vercel, not committed):
* `ANTHROPIC_API_KEY` — server-side Claude key for `/api/anthropic`
* `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
* `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (safe to expose)
* `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never expose to client

---

## 🎯 Immediate Launch Action Plan (To-Do)

1. [ ] **Secure `/api/anthropic`** — Verify Supabase JWT server-side before proxying Claude requests.
2. [ ] **Usage Limits** — Enforce Free tier quotas in Supabase to protect your API budget.
3. [ ] **Payment Gateway** — Connect Razorpay/Cashfree webhooks to handle `pro` and `lifetime` upgrades.
4. [ ] **Legal/Trust Pages** — Add Terms of Service and Refund Policy pages for gateway KYC.
5. [ ] **Demo Mode** — Ship `/app?demo=1` for friction-free visitor testing.

---

Built by [Amit Bhargav](https://linkedin.com/in/amitbhargav) — Senior TPM & AI Builder · Bengaluru 🇮🇳