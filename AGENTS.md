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

## Notes for agents
- Focus theme edits in CSS and HTML only; backend API files in `api/` are unrelated to visual theme updates.
- Keep content structure stable: the site is mostly static and does not use a JS build tool.
- Do not create a separate dark theme unless explicitly requested.
