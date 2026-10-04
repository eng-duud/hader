# Hader (حاضر) — Company Website: Build Plan for the Implementing Agent

**Audience:** the coding agent that will build this site end to end.
**Owner:** founder of Hader, based in Sanaa, Yemen. Technical (final-year IT student), reviews your work, does not want to be asked about things you can decide yourself.
**How to work:** make reasonable decisions from this document. Ask the owner only about true blockers (see section 15). Record every assumption in `docs/DECISIONS.md`.

---

## 1. Product summary

Hader (حاضر, "present / ready") is a small digital-services company serving upscale businesses in Yemen (restaurants, restaurant chains, clinics, malls, service companies). Services:

1. **Website building** for businesses (primary offer, lead with this).
2. **Automated replies** to comments and messages on social platforms, with filtering and escalation of complaints to a human.
3. **Map and local-search presence** (Google Business listing / map pinning).

The website you are building is **Hader's own company site**. Its jobs, in order:

1. **Credibility.** A restaurant manager googles us before replying. The site must look serious and trustworthy.
2. **Lead capture.** Contact form and WhatsApp button.
3. **Showcase.** A client list with live links to client sites (this is the portfolio).
4. **Support Meta business verification.** Meta will check that the company has a real web presence: company name, contact details, privacy policy, terms, domain-matched email.

It is also the first test of the template and admin panel that will later be reused for client sites, so build the admin panel cleanly and generically.

## 2. Decided stack (do not change without writing a reason in DECISIONS.md)

| Concern | Choice |
|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** — the owner wants React on Vercel |
| Styling | Tailwind CSS with logical properties (`ms-*`, `pe-*`, `text-start`) so RTL/LTR both work |
| i18n | **next-intl**, locales `ar` (default, RTL) and `en` (LTR), locale in URL (`/ar/...`, `/en/...`) |
| Database, auth, file storage | **Supabase** (Postgres + Auth + Storage) with Row Level Security |
| Validation | zod, on client and server |
| Email notifications | Resend (or any SMTP provider behind a small interface) |
| Hosting | Vercel, connected to a GitHub repo, preview deployments on PRs |
| Fonts | Self-hosted via `next/font` (Arabic: IBM Plex Sans Arabic or Cairo; Latin: Inter or similar). No third-party font requests at runtime |

**Portability rule.** Keep all data access behind a thin data layer (`/lib/data/*`) and keep schema as plain SQL migrations. The owner is in Yemen, where provider availability and connectivity can be unstable; we must be able to move the database or host without rewriting the app.

## 3. Brand and design direction

- Name: **حاضر** / **Hader**. Tagline for the site (draft, refine): AR «حاضر… ليكون عملك حاضراً حيث يبحث زبائنك» / EN "Hader — be present where your customers look."
- No logo exists yet. Create a clean **wordmark** (Arabic calligraphic-neutral, not decorative) as SVG, plus a simple favicon. Make it easy to swap later (single file in `/public/brand`).
- Tone: confident, calm, professional. This is B2B for owners of premium venues. Restrained and typographic, generous whitespace, strong Arabic typography.
- Avoid generic "AI startup" aesthetics (purple gradients, glassmorphism, stock illustrations). Avoid stock photos of handshakes.
- Propose a palette in `docs/DESIGN.md`: one deep primary, one accent, neutral surfaces, full dark-mode token set. Check contrast (WCAG AA).
- Mobile first. Most visitors are on phones with slow, unstable connections.

## 4. Public site: pages and content

All pages exist in `ar` and `en`. Arabic is the primary, reviewed language; English mirrors it.

### 4.1 Home (`/`)
1. **Header:** wordmark, nav (Services, Clients, Packages, FAQ, Contact), language switch, primary CTA "Request a proposal / اطلب عرضاً".
2. **Hero:** headline, one-sentence subhead, two CTAs (WhatsApp, Contact form). No fake statistics.
3. **Problem and promise:** short block on why businesses lose customers (no web presence, slow replies).
4. **Services:** three cards (Websites, Reply automation, Map presence). Websites is visually primary. Automation is described as "available on request" and must **not** claim official partnership with Meta or guaranteed platform access.
5. **How it works:** 3 to 4 steps (Discovery, Build, Launch, Support), with the human-escalation promise stated for automation.
6. **Featured clients:** the clients marked `is_featured` in admin, shown as cards (logo, name, short description, "Visit site" link).
7. **Packages:** driven from admin; each package has a "Request this" CTA. Price field optional; if empty show "Contact us / تواصل معنا".
8. **FAQ:** accordion, admin-managed.
9. **Final CTA + footer:** contact details, social links, privacy and terms links, copyright, legal company name.

### 4.2 Clients (`/clients`)
Grid of all published clients, featured first, then by `sort_order`. Filter chips by category (Restaurants, Clinics, Retail, Services, Other; admin-managed categories). Each card: logo or screenshot, name, description (localized), category, **Visit live site** (opens a new tab, `rel="noopener noreferrer"`). Optional detail view at `/clients/[slug]`.

### 4.3 Contact (`/contact`)
Form: name, business name, phone/WhatsApp, email (optional), interest (checkboxes for the three services), message. Show company email, phone, WhatsApp link, address/city, working hours.

### 4.4 Legal
`/privacy` and `/terms`, both editable from admin as rich text/markdown, both localized. Seed with sensible placeholder text and clearly mark "REVIEW WITH A LAWYER" in `docs/CONTENT.md` (not on the public page). Required for Meta app review.

### 4.5 Global
- Floating WhatsApp button (configurable number, hidden if unset).
- 404 and error pages localized.
- No testimonials section and no case-study numbers until real data exists. Build the components but keep them hidden when empty.

## 5. Admin panel (`/admin`) — controls the whole site

The owner wants to control the entire site from the panel without touching code. Anything that appears on the public site must be editable here.

### 5.1 Access
- Supabase Auth, email + password; strongly recommend and implement **TOTP 2FA** if Supabase supports it on the plan used.
- Roles: `owner` (everything) and `editor` (content, no users/settings). Start with one owner account created via a seed script, not a public signup.
- Admin routes are server-protected (middleware + server checks), never only hidden in the UI. Rate-limit login attempts.
- Admin UI language: Arabic default, English toggle. RTL-correct.

### 5.2 Modules

| Module | What the owner can do |
|---|---|
| **Dashboard** | Counts: new leads, published clients, drafts. Latest leads. |
| **Clients** | Add, edit, delete, reorder, publish/unpublish, mark **featured**. Fields below. |
| **Services** | Edit the three service cards (title, text, icon, order, visibility). |
| **Packages** | CRUD with bilingual name, description, feature list, optional price, highlight flag, order. |
| **FAQ** | CRUD, reorder, bilingual. |
| **Process steps** | CRUD, reorder, bilingual. |
| **Pages and text blocks** | Edit hero, problem/promise text, CTA text, footer, privacy, terms. |
| **Leads** | List contact-form submissions, status (new / contacted / won / lost), notes, export CSV. |
| **Media** | Upload, list, delete images; used by clients and pages. |
| **Settings** | Company legal name, phone, WhatsApp, email, address, hours, social links, default SEO title/description, OG image, analytics ID. |
| **Users** (owner only) | Invite/remove editors. |

### 5.3 Client record (the main thing the owner stressed)

| Field | Notes |
|---|---|
| `name_ar`, `name_en` | required |
| `slug` | auto from English name, editable, unique |
| `description_ar`, `description_en` | short, required, with a character limit shown live |
| `website_url` | required, must be a valid `https://` URL, validated server-side; show a "check link" button that opens it |
| `logo` | image upload (required) |
| `cover_image` | optional screenshot/thumbnail upload |
| `category` | select from admin-managed list |
| `is_featured` | boolean; featured clients appear on the home page and first on `/clients` |
| `is_published` | boolean; unpublished stay hidden from public |
| `sort_order` | integer; drag-and-drop reorder in the list |
| `created_at`, `updated_at` | automatic |

List view: search, filter by category/featured/published, quick toggles for featured and published, bulk delete with confirmation. Deleting a client also removes its stored images.

### 5.4 Editing experience
- Every translatable field has side-by-side AR/EN inputs. Warn (do not block) when one language is empty; public site falls back to the other language for missing fields.
- Autosave drafts or a clear "unsaved changes" guard.
- After saving, the public site updates within seconds (use on-demand revalidation via `revalidateTag`/`revalidatePath`, not a full redeploy).

## 6. Data model (create as SQL migrations in `/supabase/migrations`)

- `site_settings` (single row or key/value): company and contact info, social links, SEO defaults, analytics ID.
- `content_blocks`: `key` (unique), `value_ar`, `value_en`, optional `type` (text | markdown). Used for hero, promise, CTA, footer, privacy, terms.
- `services`, `packages`, `faqs`, `process_steps`: bilingual text fields, `sort_order`, `is_visible`.
- `client_categories`: `slug`, `name_ar`, `name_en`, `sort_order`.
- `clients`: as in 5.3, with `category_id` FK.
- `leads`: name, business_name, phone, email, interests (array), message, status, notes, locale, source_page, user_agent, created_at.
- `media`: storage path, public URL, alt_ar, alt_en, width, height, created_at.
- `profiles`: `user_id`, `role` (owner | editor).

**Row Level Security (mandatory):**
- Public (anon): `select` only on published/visible rows of public content tables. No access to `leads`, `profiles`, unpublished rows.
- `leads`: anon may `insert` **only** through the server route handler (service role on the server), never directly from the browser.
- Writes to all content tables: authenticated users with role `owner` or `editor`. `profiles` and `site_settings` writes: `owner` only.
- The Supabase **service-role key must never reach the browser**.

Provide a **seed script** (`pnpm seed`) with: the 3 services, sample FAQs, process steps, 3 sample packages, categories, **no fake clients** (or 2 clearly labeled demo clients that are unpublished).

## 7. Contact form and lead handling

- Server action or route handler, zod-validated.
- Spam protection: honeypot field, minimum time-to-submit check, IP rate limit (e.g. 5 per hour). Add Cloudflare Turnstile as an optional env-flagged layer.
- On success: store in `leads`, email the owner (Resend), show a localized success message with a WhatsApp follow-up link.
- Never expose internal errors; log them server-side.
- Privacy: short consent line linking to the privacy policy.

## 8. SEO, performance, accessibility

- Per-page metadata, localized titles/descriptions, canonical URLs, `hreflang` between `ar` and `en`, `sitemap.xml` (including published clients), `robots.txt`, Open Graph/Twitter images (default OG image from settings).
- JSON-LD: `Organization` on all pages; `WebSite` on home.
- Performance targets on a throttled mobile profile: Lighthouse Performance ≥ 90, LCP < 2.5 s, CLS < 0.1, total initial JS as small as practical. Use `next/image`, correct sizes, lazy loading, minimal client components (admin-only libraries must not ship to public pages).
- Accessibility: semantic HTML, keyboard navigation, focus states, `lang` and `dir` set per locale, alt text from the media table, AA contrast, reduced-motion respected.
- Motion: subtle only; no heavy animation libraries on public pages.

## 9. Security checklist

- Security headers (CSP appropriate for the stack, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protection).
- Secrets only in env vars; commit `.env.example`, never real values.
- Server-side validation for every admin mutation; check role on the server for each action.
- Upload limits: type allowlist (jpg, png, webp, svg sanitized or disallowed), max size, filename sanitization.
- Client `website_url` rendered with `rel="noopener noreferrer"`; reject `javascript:` and non-https schemes.
- Dependency audit in CI.
- Admin routes `noindex`.

## 10. Repository and engineering

- Monorepo not needed; single Next.js app.
- `pnpm`, TypeScript strict, ESLint, Prettier, Husky or CI lint check.
- Structure suggestion: `/app/[locale]/(site)`, `/app/[locale]/admin`, `/components`, `/lib/data`, `/lib/validation`, `/messages/{ar,en}.json`, `/supabase/migrations`, `/scripts/seed.ts`, `/docs`.
- UI strings (buttons, labels, errors) in `/messages`; editable marketing content in the database.
- Tests: unit tests for validation and URL checks; one end-to-end smoke test (Playwright) covering: home loads in both locales, contact form submits, admin login, add/feature/unpublish a client and see the public change.
- CI: lint, typecheck, build, tests on every PR.
- README with: setup, env vars, how to run Supabase migrations, how to create the owner account, how to deploy to Vercel, how to add a custom domain.

## 11. Deployment

1. GitHub repo, `main` is production, PRs get Vercel preview URLs.
2. Vercel project with env vars (Supabase URL/anon key, service-role key, Resend key, site URL, optional Turnstile and analytics keys).
3. Custom domain and domain-matched email are **owner tasks** (domain not yet bought); the app must read the canonical URL from an env var so nothing is hard-coded.
4. Enable database backups in Supabase and document how to restore.
5. Add privacy-friendly analytics (Vercel Analytics or Plausible) behind an env flag.

## 12. Environment risks to verify first

The owner is in Sanaa. Before building deeply, **verify early and report**: (a) the owner (or a teammate) can create and access GitHub, Vercel, Supabase and Resend accounts and dashboards; (b) the deployed site loads normally from a Yemeni connection. If any provider is blocked or restricted, propose the nearest portable alternative and keep the data-layer abstraction so the switch is cheap. Do not work around platform terms of service or sanctions rules; flag the issue to the owner instead.

## 13. Milestones and acceptance criteria

**M1 — Foundation (days 1–2).** Repo, Next.js, Tailwind, next-intl with RTL/LTR switching, fonts, design tokens, layout shell, Supabase schema + RLS + seed, CI. *Accept:* `/ar` and `/en` render the shell correctly in RTL and LTR; migrations apply cleanly on a fresh database.

**M2 — Admin core (days 3–5).** Auth, roles, middleware, Settings, Content blocks, Services, Packages, FAQ, Process, Media. *Accept:* owner logs in, edits each module, changes appear on the public site within seconds; an anonymous user cannot read or write protected data (verify with a test).

**M3 — Clients module and public pages (days 6–8).** Full client CRUD with featured/published/reorder, home page, `/clients` with filters, contact page, legal pages. *Accept:* adding a client with a live URL, logo, and description and marking it featured shows it on the home page; unpublishing removes it; an invalid URL is rejected.

**M4 — Leads, SEO, hardening (days 9–10).** Contact form pipeline, leads admin, sitemap/metadata/JSON-LD, security headers, performance pass. *Accept:* Lighthouse targets met on mobile throttling; submitted lead appears in admin and the owner receives an email; spam protections active.

**M5 — Launch (day 11).** Production deploy, domain hookup, final content review, handover docs. *Accept:* README lets a new developer deploy from scratch; all checklist items in section 14 pass.

## 14. Definition of done

- [ ] Both locales complete; Arabic reads natively and correctly in RTL (including numbers, punctuation, forms, and admin).
- [ ] Every public text, image, client, package, FAQ, and setting editable from `/admin`.
- [ ] Client add/edit/delete/feature/publish/reorder works, with live link validation.
- [ ] RLS verified; service-role key not present in any client bundle.
- [ ] Contact form works end to end with spam protection.
- [ ] Privacy and terms pages exist and are editable.
- [ ] SEO basics, sitemap, hreflang, OG images in place.
- [ ] Performance and accessibility targets met.
- [ ] No fake testimonials, statistics, or partnership claims anywhere.
- [ ] README, `.env.example`, `DECISIONS.md`, seed script delivered.

## 15. Inputs needed from the owner (use placeholders; do not block on these)

Final domain name; legal company name and registration details; official email, phone, WhatsApp number; address/city and working hours; social media links; logo files if they exist; initial client list (name, URL, description, logo); reviewed Arabic copy for hero, services, and packages; decision on whether to show prices.

## 16. Out of scope for v1

Online payments, blog, client login portal, chatbot on the site, automation dashboards, multi-tenant client sites. (The admin and template should be written so multi-tenant client sites can be added later.)

## 17. Draft copy (Arabic primary; refine freely, keep claims honest)

- **Hero AR:** «نبني حضورك الرقمي… ونردّ على زبائنك فوراً»
- **Hero EN:** "We build your digital presence and answer your customers instantly."
- **Subhead AR:** «مواقع احترافية، وردود مؤتمتة على منصات التواصل مع تحويل الشكاوى لفريقك، وتثبيت منشأتك على الخريطة.»
- **Subhead EN:** "Professional websites, automated replies on social platforms with complaints routed to your team, and your business pinned on the map."
- **Automation promise AR:** «الأسئلة العادية يجيب عنها النظام، وأي شكوى تصل إلى شخص من فريقك مباشرة.»
- **Automation promise EN:** "Routine questions are answered automatically; any complaint goes straight to a person on your team."
- CTA AR: «اطلب عرضاً» · EN: "Request a proposal"
