# Hader (حاضر) — Architectural & Design Decisions

This document records all architectural choices, assumptions, and conventions made during the development of Hader's web platform.

---

## ADR-001: Framework and Core Dependency Versions
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The platform requires an App Router structure, robust server components, native Arabic/English i18n, Supabase Auth/Postgres integration, and fast performance on throttled mobile connections.
* **Decision:**
  * **Framework:** Next.js `14.2.24` (App Router LTS)
  * **UI Runtime:** React `18.3.1` and `react-dom` `18.3.1` (guarantees maximum stability with dnd, SSR, and third-party UI libraries without React 19 canary quirks)
  * **Styling:** Tailwind CSS `3.4.17` utilizing native CSS logical property utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`)
  * **i18n Engine:** `next-intl` `3.26.3` with localized URL routing (`/ar`, `/en`)
  * **Data Layer & Auth:** `@supabase/supabase-js` `2.48.1` and `@supabase/ssr` `0.5.2`
  * **Validation:** `zod` `3.23.8` across both client and server schemas
  * **Package Manager:** `pnpm` `9.x` with strict dependency isolation

---

## ADR-002: URL Routing and Internationalization (i18n) Strategy
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The site must natively support Arabic (default, RTL) and English (LTR). The Brief mandates locale in URL (`/ar/...`, `/en/...`).
* **Decision:**
  * We adopt `localePrefix: 'always'` in `next-intl/middleware`.
  * The root `/` automatically negotiates and redirects to `/ar` (Arabic default).
  * In `app/[locale]/layout.tsx`, `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>` ensures proper bidirectional rendering and accessible tree labeling.
  * Navigation is handled using custom wrappers over `next-intl/navigation` (`Link`, `usePathname`, `useRouter`) so switching languages preserves the active pathname.

---

## ADR-003: Strict Logical Properties & RTL Directional Integrity
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** A mixed RTL/LTR application easily suffers visual bugs when physical left/right CSS utilities are used.
* **Decision:**
  * **Zero Physical Layout Utilities:** No `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, `left-`, or `right-` classes are allowed for layout.
  * **Logical Properties Enforced:** All layout positioning and spacing strictly use `ms-` (margin-inline-start), `me-` (margin-inline-end), `ps-` (padding-inline-start), `pe-` (padding-inline-end), `text-start`, `text-end`, `start-`, and `end-`.
  * **Directional Icon Flipping:** Directional glyphs (forward arrows, chevrons, back links) include `rtl:rotate-180` to correctly reflect reading direction.

---

## ADR-004: Self-Hosted Fonts & Zero Third-Party Runtime Overhead
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The site must load quickly on unstable Yemeni mobile networks and Meta verification bots without external font blocking or CDN latency.
* **Decision:**
  * Arabic typography: **Cairo** configured via `next/font/google` (`subsets: ['arabic', 'latin']`, `display: 'swap'`).
  * Latin typography: **Inter** configured via `next/font/google` (`subsets: ['latin']`, `display: 'swap'`).
  * `next/font` downloads and inlines font assets at build time, eliminating all runtime requests to Google servers and ensuring complete data privacy and offline resilience.

---

## ADR-005: Brand Identity & Vector Wordmark
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** No initial brand logo exists. The owner requested a clean calligraphic-neutral Arabic wordmark paired with modern Latin lettering, swappable from a single file.
* **Decision:**
  * A scalable SVG wordmark is placed at `/public/brand/wordmark.svg`.
  * Favicon assets placed at `/public/brand/favicon.svg` and linked as `/favicon.ico`.
  * The mark uses Hader's deep executive navy and gold accent, remaining razor-sharp across retina and mobile viewports.

---

## ADR-006: Data Layer Portability
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The owner is in Yemen, where external SaaS availability and connectivity can fluctuate.
* **Decision:**
  * No direct Supabase client calls in UI components.
  * All queries and mutations are encapsulated in `/lib/data/*` repositories, exposing typed domain methods.
  * Schema is maintained strictly as versioned SQL migrations in `/supabase/migrations`.

---

## ADR-007: Database Schema Structure & Integrity Constraints
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Tables must support full bilingual content, client portfolio showcases, contact leads, and site-wide settings without code modifications.
* **Decision:**
  * `site_settings` follows a singleton row pattern with `id int PRIMARY KEY DEFAULT 1 CHECK (id = 1)`.
  * `clients.website_url` is fortified with a strict regex check constraint `^https://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$` preventing non-https and `javascript:` URIs at the database level.
  * Unique constraints applied to all slugs (`services.slug`, `packages.slug`, `client_categories.slug`, `clients.slug`, `content_blocks.key`).
  * Dedicated indexes on `(is_published, sort_order)` and partial index on `is_featured WHERE is_published = true` for high-throughput public landing page queries.
  * Plpgsql trigger `set_updated_at()` automatically keeps timestamp fields synchronized.

---

## ADR-008: Strict Row Level Security (RLS) & Service-Role Isolation
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Anonymous visitors, editors, and owners have distinctly partitioned privileges. Sensitive data must never be reachable by anonymous users or leaked via browser bundles.
* **Decision:**
  * RLS is enabled on all tables without exception.
  * A security definer function `public.current_user_role()` safely resolves role without infinite recursion in RLS policies.
  * Anonymous (`anon`) role has SELECT access strictly on published/visible public tables (`site_settings`, `content_blocks`, `client_categories`, `media`, and visible rows of `services`, `packages`, `faqs`, `process_steps`, `clients`).
  * Anonymous has ZERO access to `leads` or `profiles`.
  * Anonymous has ZERO insert/update/delete rights on any table.
  * `leads` submissions are inserted exclusively on the server using `createAdminClient()` (service-role key). The Supabase service-role key is strictly isolated to server contexts and prohibited from client bundles.

---

## ADR-009: Data Layer Decoupling & Zod Mutation Gateways
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** UI components must remain decoupled from specific database client APIs, and all write operations must enforce validation.
* **Decision:**
  * All data access is funneled through typed functions in `/lib/data/*`.
  * Every mutation function validates input against Zod schemas defined in `/lib/validation/*` before passing queries to Postgres.
  * If Supabase or hosting providers ever require migration, only `/lib/data/*` repository adapters will need modification, leaving all UI components unchanged.

---

## ADR-010: Idempotent Seeding & Owner Account Bootstrapping
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Environments must be easily initialized and re-seeded without primary key conflicts or duplicate record errors, and the initial owner account must be provisioned without open public signups.
* **Decision:**
  * `scripts/seed.ts` uses Postgres UPSERT logic (`onConflict: 'slug'` or `onConflict: 'key'`), making the seed 100% idempotent across multiple runs.
  * Two demo clients are seeded strictly as `is_published: false` and explicitly labeled `[نموذج تجريبي غير منشور]` to prevent accidental publication.
  * `scripts/create-owner.ts` provisions the owner account via Supabase Auth Admin API (`createUser` with `email_confirm: true`), assigning the `owner` role in `public.profiles` without triggering rate-limited confirmation emails.

---

## ADR-011: Admin Portal Architecture & Route Isolation
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The administrative portal must provide a full CMS experience without prefixing admin paths with public locale slugs (`/ar`, `/en`), while remaining completely invisible to search engines.
* **Decision:**
  * Admin routes reside under `/admin/*` outside the public `[locale]` dynamic route group.
  * Middleware enforces `X-Robots-Tag: noindex, nofollow` on all `/admin/*` responses, and `app/admin/layout.tsx` emits metadata robots exclusions.
  * Admin language switching operates in-memory with `localStorage` persistence, dynamically switching between `dir="rtl"` (Arabic) and `dir="ltr"` (English) without requiring page reloads or route restructuring.

---

## ADR-012: Multi-Layered Server-Side Role-Based Access Control (RBAC)
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Hiding navigation links in the client UI is insufficient for security. Attackers or editors could attempt direct navigation or curl calls to mutation endpoints.
* **Decision:**
  * **Layer 1 (Middleware):** Intercepts requests to `/admin/users` and `/admin/settings`, reading the user's role from `public.profiles`. Non-owner sessions are immediately redirected to `/admin?error=forbidden`.
  * **Layer 2 (Page Loaders):** Every sensitive page calls `requireRole(['owner'])` at the root of the server component before initiating data queries.
  * **Layer 3 (Server Actions):** Every mutation function (e.g. `inviteUserAction`, `removeUserAction`, `updateUserRoleAction`) re-verifies the caller's session and role using `requireRole(['owner'])`.

---

## ADR-013: Login Rate Limiting & User Enumeration Mitigation
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Admin login forms are frequent targets for brute-force attacks and credential stuffing.
* **Decision:**
  * Implemented an IP-and-email throttle in `lib/auth/rate-limiter.ts` that enforces a maximum of 5 failed attempts per 15-minute window.
  * Login failures return an identical generic error message (`البريد الإلكتروني أو كلمة المرور غير صحيحة` / `Invalid email or password`) regardless of whether the email exists in the database or the password was incorrect, preventing user enumeration.

---

## ADR-014: TOTP Two-Factor Authentication (2FA) Implementation & Deferred Enrollment Strategy
* **Status:** Deferred / Architecture Ready
* **Date:** 2026-10-04
* **Context:** Brief section 5.1 recommends TOTP 2FA. Supabase Auth supports MFA API (`enroll`, `challenge`, `verify`). However, enforcing mandatory 2FA on initial local bootstrap would lock out the owner before QR codes can be scanned or recovery codes generated.
* **Decision:**
  * Core TOTP API integration methods are implemented in `lib/auth/totp.ts`.
  * Mandatory enforcement at login is deferred to after Milestone 4 or production deployment once the owner has completed initial dashboard access, verified authenticator app compatibility on their mobile device in Sanaa, and saved recovery codes.

---

## ADR-015: Non-Blocking Bilingual Input & Public Fallback Architecture
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Every translatable field represents an Arabic/English pair. Demanding that editors supply both translations synchronously blocks content creation and slows down Yemeni business drafting.
* **Decision:**
  * Form inputs use side-by-side Arabic/English pairs via the reusable `BilingualField` component.
  * When one language is left empty, the UI displays a subtle amber warning badge ("لغة واحدة فقط") but does not block submission.
  * Server-side Zod validation verifies that at least one language contains content.
  * The public data layer resolves missing content by falling back to the available language: `item[field_locale] || item[fallback_field]`.

---

## ADR-016: Sanitized Markdown Engine for Rich Text (Privacy & Terms)
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Legal documents (Privacy Policy and Terms of Service) require rich formatting (headings, lists, bold text, links) without opening the door to stored XSS or DOM injection attacks.
* **Decision:**
  * Rich text editing is implemented with Markdown and an instant live preview pane.
  * Created `lib/utils/sanitize.ts` providing `sanitizeHtml()` and `renderSafeMarkdown()`.
  * The engine strips `<script>`, `<iframe>`, `object`, `embed`, inline event handlers (`onload`, `onerror`, `onclick`), and `javascript:` URIs before rendering safe semantic HTML.

---

## ADR-017: Multi-Layer Media Upload Security & In-Use Referential Safety
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Media uploads can be leveraged for dangerous payload execution (web shells, SVG script tags) or lead to broken image links across the site if an in-use image is casually deleted.
* **Decision:**
  * **Allowlist:** Strictly limited to `image/jpeg`, `image/png`, `image/webp`, and `image/svg+xml`. Executable and arbitrary files (`.exe`, `.php`, `.pdf`, `.zip`) are rejected server-side.
  * **Size Enforcement:** Maximum upload size is strictly capped at 5MB server-side.
  * **SVG Sanitization:** SVG uploads are inspected and sanitized with `sanitizeHtml()` to strip any embedded `<script>` or event payloads before storage.
  * **Filename Traversal Protection:** Filenames are stripped of path separators (`/`, `\`, `..`), sanitized to `[a-z0-9._-]`, and prefixed with high-entropy unique identifiers.
  * **In-Use Safety Check:** Before deleting any media record, `checkMediaInUseAction()` inspects `site_settings.og_image_url`, `clients.logo`, `clients.cover_image`, and `content_blocks` references. If referenced, the deletion modal presents a clear warning listing all active usages and requires explicit confirmation.

---

## ADR-018: Instant On-Demand Cache Invalidation
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The public website leverages Next.js static and incremental caching for ultra-fast load times on low-bandwidth Yemeni connections. Content changes in the CMS must reflect on the public site immediately without needing a deployment rebuild.
* **Decision:**
  * Created `lib/data/revalidate.ts` with `revalidatePublicPaths()`.
  * Every mutation action (save, reorder, visibility toggle, delete) across Settings, Content Blocks, Services, Packages, FAQs, Process Steps, and Categories immediately calls `revalidatePublicPaths()` alongside the module's administrative path.
  * Purges `/ar`, `/en`, `/ar/privacy`, `/en/privacy`, `/ar/terms`, `/en/terms` on demand.

---

## ADR-019: Explicit Scope Boundary for Step 4 (Exclusion of Clients and Leads)
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Brief section 5.2 lists Clients and Leads among CMS modules, but the user prompt specifically instructs: *"Implement the content modules of Brief section 5.2 EXCEPT Clients and Leads (those come later)."*
* **Decision:**
  * Clients module (portfolio showcase, case studies, client categories filter, before/after showcase) is deferred to Step 5.
  * Leads module (CRM pipeline, lead statuses, WhatsApp click-to-chat triggers, spam-protection verification) is deferred to Step 6.
  * All foundational database tables, RLS policies, schemas, and sidebar navigation items for these modules remain intact and ready for seamless activation.

---

## ADR-020: Strict HTTPS URL Validation & Protocol Normalization
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Client portfolio entries link to external production websites. Storing unencrypted HTTP links, local IPs, or malicious URI schemes (`javascript:`, `data:`) creates security hazards and breaks mixed-content browser policies.
* **Decision:**
  * Created `validateAndNormalizeUrl()` in `lib/utils/client-helpers.ts` and integrated it into `clientSchema` and `saveClientAction`.
  * Rejects `http://`, `javascript:`, `data:`, `vbscript:`, and private loopback addresses (`localhost`, `127.0.0.1`).
  * Auto-prefixes clean bare domains (e.g. `client.ye` -> `https://client.ye/`).
  * The admin client UI features a "Check link" button with `target="_blank" rel="noopener noreferrer"` allowing instant verification.

---

## ADR-021: Phonetic Slug Generation with Arabic Fallback & Collision Avoidance
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Clients need human-readable, unique URL slugs. In Yemen, some clients are registered exclusively with Arabic names, while others might have identical names resulting in slug collisions.
* **Decision:**
  * Implemented `generateClientSlug()` with phonetic transliteration `transliterateArabic()` to turn Arabic-only names (e.g. `صنعاء`) into clean alphanumeric slugs (`snaaa`).
  * Normalizes punctuation, collapses duplicate hyphens, and removes accents.
  * Checks existing slugs in the database and appends `-2`, `-3` automatically to prevent collisions while keeping the field fully editable by the user.

---

## ADR-022: Referential Integrity & Storage Cleanup on Client Deletion
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** When a client is removed, its associated assets (logo, cover image) stored in the Supabase Storage `media` bucket would become orphaned, wasting bucket storage and confusing the media catalog.
* **Decision:**
  * Updated `deleteClientRecord()` and implemented `deleteMultipleClients()`.
  * Extracts storage paths via `extractStoragePath()` and issues `supabase.storage.from('media').remove(...)` and `supabase.from('media').delete()` before completing the database row deletion.
  * Implemented defensive error handling: Storage failures are caught and logged without aborting the client record deletion if the file was already deleted.

---

## ADR-023: Client Portfolio Administrative UX & Live Card Preview
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Managing clients is the owner's most critical administrative capability. The interface needs powerful search/filtering, bulk actions, and live visual confirmation before publishing.
* **Decision:**
  * Built `ClientsClient.tsx` with search across all fields (AR, EN, URL, Slug), category dropdown filter, and binary filters for `is_featured` and `is_published`.
  * Implemented bulk selection and bulk deletion with dedicated confirmation modals.
  * Included an interactive "Public Card Live Preview" tab within the drawer modal that renders the exact public card component (logo, cover, category badge, typography, and "Visit Website" link) in real time.

---

## ADR-024: Public Data Layer Decoupling & Server Component Architecture
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Public pages must load instantaneously on throttled Yemeni mobile connections (3G/4G). The site must be 100% data-driven from the admin CMS while maintaining strict bundle isolation from administrative libraries.
* **Decision:**
  * Public pages (`/`, `/clients`, `/clients/[slug]`, `/contact`, `/privacy`, `/terms`) are implemented strictly as React Server Components (RSC).
  * Data queries run on the server through repository methods in `/lib/data/*` (`getSiteSettings`, `getContentBlocks`, `getPublicServices`, `getPublicPackages`, `getPublicFaqs`, `getPublicProcessSteps`, `getFeaturedClients`, `getPublishedClients`, `getPublishedClientCategories`).
  * Interactive client components are restricted to minimal interactive islands:
    1. `ClientFilterChips.tsx`: Client-side instant category filtering without route reloads.
    2. `FaqAccordion.tsx`: Accessible, keyboard-friendly accordion for FAQ questions.
    3. `FloatingWhatsApp.tsx`: Fixed floating action button that opens WhatsApp.
  * Zero administrative dependencies (TipTap/Markdown editors, `@hello-pangea/dnd`, Lucide admin icons, Supabase auth cookie mutators) are imported into public bundles, guaranteeing a lightweight JavaScript payload.

---

## ADR-025: Meta Policy & Third-Party Platform Compliance (Zero Partner Claims)
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The Brief strictly prohibits claiming official Meta partnership or guaranteed WhatsApp/Instagram platform access. Violations cause ad account bans and misrepresent legal agency relationships.
* **Decision:**
  * "Websites" (`مواقع الشركات والصفحات التعريفية`) is positioned as Hader's primary flagship service with elevated visual hierarchy.
  * "Reply Automation" (`أتمتة الردود والمراسلات`) and "Map Presence" (`التواجد والظهور على الخرائط`) are designated and badged as "Available on request" (`متاح عند الطلب`).
  * No claims of Meta partnership, official WhatsApp Business API ownership, or guaranteed platform access exist anywhere in copy, schemas, or metadata. Copy explicitly reflects standard, transparent integration workflows.

---

## ADR-026: Empty-Safe Component Invariant for Testimonials and Case Studies
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The Brief mandates: *"Testimonials and case-study components may exist but must render nothing when empty. No fake testimonials, statistics, or partnership claims."*
* **Decision:**
  * Created `TestimonialsSection.tsx` and `CaseStudiesSection.tsx` with a strict empty check (`if (!items || items.length === 0) return null;`).
  * If no verified testimonials or case studies are present in the database, the components render nothing (no empty container, no placeholder cards, no layout shifts).
  * Prevents artificial social proof, maintaining high brand credibility and ethical transparency.

---

## ADR-027: Bidi Isolation for Mixed Arabic/English Strings & Numbers
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Mixed Arabic and English strings (such as brand names like "WhatsApp", URLs, email addresses, and phone numbers like `+967 777 000 000`) cause bidirectional text inversion in RTL layouts (e.g., plus signs or parentheses moving to the wrong side of the string).
* **Decision:**
  * All telephone numbers, emails, URLs, and price currency amounts are explicitly wrapped with `dir="ltr"` and `unicode-bidi: isolate` / `inline-block`.
  * Preserves correct punctuation and digit order in both Arabic (RTL) and English (LTR) display modes.

---

## ADR-028: Multi-Layer Spam Defense for Public Inquiries
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Public contact forms are frequent targets of automated spam, credential stuffing, and bot crawling. Protection must not degrade human UX or expose defensive heuristics.
* **Decision:**
  * **Honeypot Trap:** Invisible field (`hp_field`) with `tabindex="-1"` and `aria-hidden="true"`. Any bot filling this field receives a 200 OK silent success response with zero database insertion.
  * **Submission Velocity Check:** Form mount timestamp is verified on submission; completion under 3,000ms is silently discarded as non-human script execution.
  * **IP Sliding-Window Rate Limiting:** Maximum 5 submissions per hour per IP. 6th attempts receive a localized rate-limit advisory.
  * **Cloudflare Turnstile Ready:** Integrated behind an optional env flag (`TURNSTILE_SECRET_KEY`) for zero-friction challenge verification when configured.

---

## ADR-029: Transactional Resilience (Save First, Email Second)
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The owner must receive instant email notifications for new inquiries, but external email APIs (Resend, SMTP) can experience temporary downtime or network latency.
* **Decision:**
  * Lead record is written and committed to PostgreSQL via Supabase Service Role **before** triggering email dispatch.
  * Email notification is executed asynchronously inside a protective `try...catch` block.
  * Provider errors are logged to the server telemetry without aborting the client response or rolling back the lead insertion. The lead is permanently secured.

---

## ADR-030: Swappable Email Notification Provider Interface
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The agency currently uses Resend, but may transition to AWS SES, Postmark, or self-hosted SMTP in the future.
* **Decision:**
  * Created `EmailProvider` interface in `lib/email/index.ts` with `sendLeadNotification()`.
  * `ResendEmailProvider` communicates directly with `https://api.resend.com/emails` using native fetch without third-party SDK dependencies.
  * Automatically activates mock console logging in local dev and testing environments when `RESEND_API_KEY` is omitted, eliminating broken local test runs.

---

## ADR-031: Admin XSS Defense & UTF-8 BOM CSV Export
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Leads data submitted by arbitrary web visitors may contain malicious script tags (`<script>`, `<iframe>`, `javascript:`) intended to attack authenticated administrators. Exported CSV files must also support Arabic characters in Microsoft Excel.
* **Decision:**
  * All lead fields in the admin dashboard and detail modal are rendered strictly as escaped React text nodes (`whitespace-pre-wrap break-words`). Zero `dangerouslySetInnerHTML` is used.
  * CSV export prepends a UTF-8 Byte Order Mark (`\uFEFF`), ensuring Excel and spreadsheet software correctly detect UTF-8 Arabic strings without garbled text.

---

## ADR-032: Defensive HTTP Headers, Content Security Policy (CSP), and Frame Protection
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Modern web applications require strict HTTP defense-in-depth headers to prevent clickjacking, MIME-sniffing, XSS execution, and unintended browser feature access.
* **Decision:**
  * Configured `next.config.mjs` to inject standard defensive headers on all routes:
    * `X-Content-Type-Options: nosniff`
    * `X-Frame-Options: DENY` (and `frame-ancestors 'none'` in CSP) to prevent clickjacking.
    * `Referrer-Policy: strict-origin-when-cross-origin`
    * `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
    * `X-XSS-Protection: 1; mode=block`
  * Implemented a strict Content Security Policy (CSP) accommodating Next.js App Router inline script hydrations, Cloudflare Turnstile CAPTCHA frames, and Supabase / Resend API connect endpoints.
  * Admin routes are additionally tagged with `X-Robots-Tag: noindex, nofollow` in `middleware.ts`.

---

## ADR-033: Localized Metadata, Canonical URL Generation, and Dynamic Sitemap/Robots Architecture
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** Search engines require clear canonical signals, correct `hreflang` alternate links between Arabic (`ar`) and English (`en`), structured data schemas (`Organization` and `WebSite`), dynamic XML sitemaps, and robots exclusion for administrative endpoints. Canonical site URLs must never be hard-coded.
* **Decision:**
  * Canonical base URL is derived strictly from `process.env.NEXT_PUBLIC_SITE_URL` (with standard domain fallback `https://hader.ye`).
  * Every public page (`/ar`, `/en`, `/ar/clients`, `/en/clients`, `/ar/clients/[slug]`, `/en/clients/[slug]`, `/ar/contact`, `/en/contact`, `/ar/privacy`, `/en/privacy`, `/ar/terms`, `/en/terms`) exports localized metadata with self-referencing `canonical` and cross-referencing `languages` alternates (`ar` and `en`).
  * `app/robots.ts` disallows `/admin`, `/admin/*`, `/api/*`, and `/_next/*`, pointing search engines to the dynamic sitemap.
  * `app/sitemap.ts` generates dynamic entries with priorities, change frequencies, and `alternates.languages` for all static routes and published clients.
  * Embedded JSON-LD `Organization` schema in `app/[locale]/layout.tsx` and `WebSite` schema with `SearchAction` in `app/[locale]/(site)/page.tsx`.

---

## ADR-034: WCAG 2.2 AA Accessibility, Keyboard Navigation, and Reduced Motion Discipline
* **Status:** Accepted
* **Date:** 2026-10-04
* **Context:** The platform must be fully accessible to screen reader users, keyboard-only operators, and users with motion sensitivity, supporting both Arabic and English locales.
* **Decision:**
  * **Skip to Main Content:** Added keyboard bypass link `<a href="#main-content">` as the first focusable element in `app/[locale]/layout.tsx`, targeting `<main id="main-content" tabIndex={-1}>`.
  * **Visible Focus Indicators:** Globally enforced high-contrast focus rings (`outline: 2px solid var(--color-accent) !important; outline-offset: 2px !important;`) on `:focus-visible`.
  * **Form Accessibility:** Form controls throughout the application (public contact form, admin login, filters, search bars) strictly associate `<label htmlFor="id">` with `<input id="id">`, provide `aria-describedby` pointing to error alerts, `aria-invalid`, and `aria-required`.
  * **Reduced Motion:** Implemented `@media (prefers-reduced-motion: reduce)` in `app/globals.css`, reducing animation and transition durations to 0.01ms and setting `scroll-behavior: auto`.
  * **Color Contrast:** Both light (`#111827` on `#F8FAFC`, >12:1) and dark (`#F1F5F9` on `#0B0F19`, >14:1) themes maintain contrast ratios well exceeding WCAG AA minimums (4.5:1 for body, 3:1 for large text).





