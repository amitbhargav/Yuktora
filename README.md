# Yuktora 🚀
An advanced, multi-page client-side automated job tracking and AI-driven match analytics platform.

---

## 🛠️ System Architecture & Tech Stack
* **Frontend:** Multi-page architecture (`app.html`, `signin.html`, `index.html`, `privacy.html`) using Vanilla JS, HTML5, and CSS3.
* **Hosting:** Vercel (automatic main-branch deployment).
* **Database & Auth:** Supabase (Mumbai) with Passwordless Magic Links and RLS policies.
* **Development:** VS Code with Cline extension.

---

## 📜 Project Milestones & Changelog

### Phase 1: Core Foundation
* **Monolithic Dashboard:** Established `app.html` for main application state and job tracking.
* **Dynamic Config:** Implemented client-side string replacement to securely connect with Supabase using Anon keys.

### Phase 2: Security & Authentication
* **Decoupled Auth:** Moved authentication to `signin.html` to establish a secure perimeter.
* **Route Guards:** Implemented session checks in `app.html`, forcing redirection for unauthenticated users.
* **Data Isolation:** Applied RLS policies to `user_profiles` and `tracked_jobs` tables.

### Phase 3: Compliance & AI Interface (Latest)
* **DPDP Compliance:** Added mandatory privacy policy checkbox and validation logic on `signin.html`.
* **Security Hardening:** Implemented `escapeHTML` to prevent XSS, replacing `.innerHTML` with `.textContent`.
* **AI Analytics UI:** Developed frontend structures for the Fit Meter, Keyword Gap Grid, and Resume Tailor Card.

---

## 🔮 Upcoming Roadmap
1.  **Resume Storage:** Create `user_profiles` table modifications for storing user resumes.
2.  **Edge Functions:** Deploy Supabase Edge Functions for secure, serverless interaction with the Claude API.
