# Hader (حاضر) — Project Handover & Agency Client Reuse Guide

**Document Version:** 1.0.0  
**Date:** October 2026  
**Audience:** Platform Owner, Agency Engineers, and Future Maintainers  
**Repository:** `hader-website`

---

## 1. Architecture Overview

The Hader platform is built as an enterprise-grade, high-performance bilingual web application and content management system designed to serve both as Hader's corporate presence and as the master boilerplate template for future upscale client projects in Yemen.

### Architectural Core:
- **Presentation Tier:** Next.js 14 App Router with React Server Components (RSC) for near-instant Time to First Byte (TTFB) and minimal client JavaScript.
- **Styling & Layout:** Tailwind CSS using strictly logical properties (`ms-*`, `pe-*`, `start-*`, `text-start`), delivering flawless bidirectional layout flipping between Arabic (`rtl`) and English (`ltr`).
- **Data Abstraction Layer (`lib/data/*`):** All queries and mutations are isolated behind typed TypeScript interfaces. The application never binds UI components directly to database schemas, allowing database engine migration without touching user interface code.
- **Security & Authorization:** Supabase PostgreSQL with strict Row-Level Security (RLS) policies on all tables, server-verified RBAC (`owner` vs `editor`), rate-limiting, and defensive HTTP headers.
- **Transactional Communications:** Decoupled `EmailProvider` interface currently backed by Resend with safe fallback to server logging.

```
+-------------------------------------------------------------------------+
|                           Next.js App Router                            |
|  - Public Routes: /[locale]/(site)/* (RSC, zero client JS where viable) |
|  - Admin Routes:  /admin/* (Protected, authenticated, reactive CRUD)    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       Data Abstraction Layer                            |
|   lib/data/settings.ts, clients.ts, content.ts, services.ts, leads.ts   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  Supabase PostgreSQL & Storage Layer                    |
|   11 Tables with RLS | Media Bucket (5MB, MIME allowlist, sanitized)    |
+-------------------------------------------------------------------------+
```

---

## 2. Reusing the Template & Admin for Future Client Sites

This codebase is deliberately architected so Hader can clone, rebrand, and deploy custom websites for agency clients (restaurants, clinics, hotels, retail) in a matter of hours.

### What to Keep (Do Not Change):
1. **The Admin Panel Shell & Architecture (`app/admin/*`):**
   - The responsive sidebar, top bar, admin language switcher, and toast notification system.
   - Authentication flow, rate-limited login, and password visibility toggles.
   - Reusable admin UI primitives (`BilingualField`, `DataTable`, `ImageUploader`, `ConfirmModal`).
2. **Internationalization & RTL Engine (`i18n/*`, `navigation.ts`, `middleware.ts`):**
   - The path-preserving locale switcher and dynamic `lang`/`dir` document attributes.
   - Bidirectional font subsets and typography layout rules.
3. **Security & Validation Infrastructure:**
   - Security headers in `next.config.mjs` and anti-clickjacking CSP rules.
   - Multi-layer spam defenses on forms (honeypot, velocity checks, IP rate limiting).
   - Zod validation schemas and server-side role verification.
   - Safe markdown rendering (`lib/utils/sanitize.ts`).
4. **Data Access Pattern (`lib/data/*`):**
   - Retain the separation between server actions, data layer helpers, and UI components.

### What to Change for a New Client:
1. **Brand Assets (`/public/brand`):**
   - Replace `/public/brand/wordmark.svg` with the client's corporate logo.
   - Replace `/public/brand/favicon.svg` with the client's favicon.
2. **Color Palette & Design Tokens (`app/globals.css`, `docs/DESIGN.md`):**
   - Update CSS variables in `:root` and `.dark` in `app/globals.css` to match the client's brand guidelines (primary, accent, and surface tokens).
3. **Database Seed & Settings (`scripts/seed.ts`):**
   - Update `company_name_ar`, `company_name_en`, phone, address, and social links in the seed script.
   - Adjust baseline categories and services to match the client's industry (e.g. food categories for a restaurant, medical specialties for a clinic).
4. **Custom Schema Additions (`supabase/migrations/`):**
   - If the client requires custom tables (e.g. `menu_items`, `doctor_profiles`, `booking_requests`), create a new migration following the established pattern:
     ```sql
     CREATE TABLE public.menu_items (...);
     ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
     -- Anon can select visible items; authenticated editors can insert/update/delete
     ```
5. **Environment Configuration (`.env.local` / Vercel):**
   - Connect to the client's dedicated Supabase project and Resend account.
   - Set `NEXT_PUBLIC_SITE_URL` to the client's custom domain.

---

## 3. Maintenance Checklist

### A. Dependency & Security Updates (Quarterly)
```bash
# 1. Run security vulnerability scan
pnpm audit

# 2. Check for outdated packages
pnpm outdated

# 3. Interactively upgrade dependencies
pnpm update --interactive

# 4. Verify TypeScript and linting
pnpm typecheck
pnpm lint

# 5. Run test suite
pnpm test:all
```

### B. Database Backups & Disaster Recovery (Monthly)
- Verify automated daily backups are active in the Supabase Dashboard under **Project Settings $\rightarrow$ Database $\rightarrow$ Backups**.
- Perform a manual export before deploying any schema migration:
  ```bash
  pg_dump "$DATABASE_URL" --format=plain --no-owner --clean > pre_migration_backup.sql
  ```
- Regularly test database restoration on a local or staging Supabase instance using `scripts/test-rls.ts`.

### C. Operational & Performance Monitoring
1. **Vercel Analytics & Speed Insights:** Monitor mobile First Contentful Paint (FCP) and Largest Contentful Paint (LCP) from Yemeni mobile connections to ensure scores remain $\ge 90$.
2. **Resend Delivery Dashboard:** Inspect outbound email logs for bounces, spam reports, or API delivery failures.
3. **Rate-Limiter Logs:** Review server telemetry for repeated blocked IP addresses or credential stuffing attempts on `/admin/login`.
4. **Domain & SSL Expiry:** Vercel automatically renews Let's Encrypt SSL certificates. Ensure the apex domain registration with the local registrar is renewed annually.

---

## 4. Known Limitations & Future Roadmap

| Feature / Area | Current v1 Implementation | Future v2 Recommendation |
| :--- | :--- | :--- |
| **Rate Limiting** | In-memory sliding window cache (`lib/security/spam-protection.ts`). Sufficient for single-instance or serverless edge with modest concurrency. | Transition to Upstash Redis or Supabase PostgreSQL function for distributed multi-region horizontal scaling. |
| **Video Media** | Supabase Storage bucket hosts images, logos, and sanitized SVGs up to 5MB. | Embed large video promotional assets via YouTube / Vimeo iframes or Cloudflare Stream rather than direct database storage. |
| **Online Payments** | Not included in v1 scope (Yemen banking integration typically requires manual wire transfer / local cash wallets like Kuraimi / Jawwal). | Add local payment gateway webhook integration (e.g. Floos / Kuraimi Pay) when public APIs become available. |
| **Client Portal** | `/admin` is restricted to agency staff (`owner` and `editor`). | Introduce multi-tenant permissions allowing external clients to log in and view their specific leads without accessing other agency data. |
| **Search Functionality** | Client filtering and search executed through reactive client filtering and SQL queries. | Add full-text search indexing (PostgreSQL `tsvector` or Algolia) if client portfolio exceeds 500 items. |

---

## 5. Contact & Support Escalation

- **Platform Lead:** Founder, Hader Digital Business Solutions
- **Headquarters:** Sanaa, Republic of Yemen
- **Technical Support:** `contact@hader.ye`
- **Security Inquiries:** `security@hader.ye`
