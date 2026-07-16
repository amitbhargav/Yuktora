# Yuktora 🚀
An advanced, client-side automated job tracking and AI-driven match analytics platform built as a high-performance monolithic web application.

---

## 🛠️ System Architecture & Tech Stack
* **Frontend:** Monolithic single-file single-page application architecture (`app.html`) built using pure Vanilla JavaScript, HTML5, and semantic CSS3.
* **Hosting & Deployment:** Static site hosting with global edge routing deployed natively via Vercel.
* **Database & Authentication Server:** Live Supabase cloud instance (Mumbai region) utilizing passwordless Magic Link authentication infrastructure and automated JWT verification profiles.
* **Development Automation:** VS Code integrated with the Cline extension engine for structural code modification, refactoring, and automated validation passes.

---

## 📜 Complete Project Changelog & Master Milestone Log

### Phase 1: Core Foundation & Serverless Layering
* **Monolithic Core Setup:** Created the single-file architectural layout (`app.html`) to hold all UI, style sheets, and routing mechanisms, ensuring instantaneous page loading states.
* **Vercel Proxy Setup:** Configured environment variables and routing structures to map external communication layers cleanly across serverless boundaries.
* **Dynamic Script Injection:** Fixed a critical serverless string replacement bug by migrating configuration keys into a dynamic frontend script injection framework, ensuring the public-facing Anon keys connect safely with Supabase directly on the client side.

### Phase 2: Security & Authentication Hardening
* **Passwordless Magic Links:** Completely ripped out old, insecure password text fields. Replaced them with modern, industry-standard Supabase Passwordless Magic Link email authentication.
* **Row Level Security (RLS) Isolation:** Initialized and locked down strict relational security policies on the backend tables (`user_profiles` and `tracked_jobs`). This explicitly prevents cross-tenant data leaks, ensuring that logged-in users can only read or write their own row data.

### Phase 3: Compliance & AI Engine Skeletons (Latest Changes)
* **Legal Compliance Checkbox:** Integrated a mandatory privacy policy and terms of service acceptance checkbox immediately under the email sign-in field.
* **Dynamic State UI Validation:** Programmed client-side event binding logic that dynamically disables the 'Send Magic Link' submit action, scales down opacity, and locks mouse cursors until compliance confirmation is checked.
* **AI Match Analytics Interface:** Formulated the full frontend structural components for the upcoming machine learning dashboard blocks:
  * **Fit Meter Gauge:** A visual circular asset representing predictive job application match percentages.
  * **Keyword Gap Grid:** A dual-column layout mapping critical user resume competencies against missing job posting requirements with clean color status codes.
  * **Resume Tailor Card:** A contextual container designed to display automated bullet-point profile optimization instructions along with interactive AI trigger hooks.

---

## 🔮 Upcoming Architectural Roadmap
1. **User Profile Text Schema:** Build out dedicated `user_profiles` table modifications inside Supabase to securely save and store raw, unformatted text copies of user resumes.
2. **Supabase Edge Function Processing:** Deploy secure server-side TypeScript modules on the Supabase Edge network to isolate commercial Anthropic/Claude API keys. This will handle the analytical load safely away from the public user browser.
