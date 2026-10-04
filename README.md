# Hader (حاضر) — Official Company Web Platform & Developer Handbook

The official bilingual web platform and administrative content management system for **Hader (حاضر)**, a premier digital presence and business solutions studio based in Sanaa, Yemen, catering to upscale restaurants, medical clinics, retail centers, and commercial enterprises.

---

## 1. Architecture & Technology Stack

| Concern | Technology & Version | Architecture Decision |
| :--- | :--- | :--- |
| **Framework** | **Next.js `14.2.24` (App Router)** | Full React Server Components, server actions, dynamic routing |
| **Language** | **TypeScript `5.6.3`** | Strict mode enforced, zero `any` across business logic |
| **Styling** | **Tailwind CSS `3.4.17`** | Strictly CSS logical properties (`ms-*`, `pe-*`, `text-start`, `start-*`) |
| **Internationalization** | **`next-intl` `3.26.3`** | Bilingual URL paths (`/ar` default RTL, `/en` LTR), path-preserving switcher |
| **Typography** | **`next/font/google`** | Self-hosted `Cairo` (Arabic) and `Inter` (Latin), zero runtime font requests |
| **Database & Auth** | **Supabase (PostgreSQL 15)** | Full Row-Level Security (RLS) policies, secure HTTP-only cookies via `@supabase/ssr` |
| **Data Layer** | **Portable Abstraction (`lib/data/*`)** | Swappable database layer protecting against regional vendor lock-in |
| **Validation** | **Zod `3.23.8`** | Dual client & server payload validation with HTTPS URL protocol enforcement |
| **Transactional Email**| **Resend API** | Decoupled behind `EmailProvider` interface (`lib/email/index.ts`) |
| **Testing** | **Playwright + TSX** | Programmatic smoke suites, axe-core accessibility, and browser E2E |

---

## 2. Prerequisites & Local Environment Setup

### Required Tooling:
- **Node.js**: `v20.x` or higher (LTS recommended)
- **pnpm**: `v9.x` or higher (`npm install -g pnpm`)
- **Git**: Installed and configured
- **Supabase Account**: Free or Pro tier project (or local Supabase CLI)
- **Resend Account**: (Optional for local development; mock fallback active when key is omitted)

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/hader-agency/hader-website.git
cd hader-website
pnpm install
```

---

## 3. Environment Variables Breakdown

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Complete Variable Reference:

| Variable Name | Required | Environment | Description & Example |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Client/Server | Canonical base URL used for sitemap, robots, OpenGraph, and hreflang links. Local: `http://localhost:3000`, Production: `https://hader.ye`. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client/Server | Public HTTPS endpoint for your Supabase project (e.g. `https://xyzproject.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client/Server | Public anonymous API key. Safe for client bundles; operations are restricted by Postgres RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | **Server Only** | Administrative secret key with full database privileges. Used exclusively on the server for lead insertion and user creation. **NEVER expose to client**. |
| `RESEND_API_KEY` | Optional | **Server Only** | API key for transactional email notifications via Resend. If omitted, emails log cleanly to the server console. |
| `OWNER_NOTIFICATION_EMAIL` | Optional | **Server Only** | Destination email address to receive real-time lead alerts (e.g. `founder@hader.ye`). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Client/Server | Cloudflare Turnstile public site key for zero-friction CAPTCHA verification. |
| `TURNSTILE_SECRET_KEY` | Optional | **Server Only** | Cloudflare Turnstile server validation secret. |
| `NEXT_PUBLIC_ANALYTICS_ID` | Optional | Client/Server | Identifier for cookieless, privacy-friendly analytics beacon. |

---

## 4. Supabase Database Setup & Migrations

### Step 1: Execute SQL Schema Migrations
In your Supabase project dashboard, navigate to the **SQL Editor**, open `supabase/migrations/20261004000001_initial_schema.sql`, and execute it.

Alternatively, if using the Supabase CLI:
```bash
supabase db push
```

This migration provisions:
- All core tables: `site_settings`, `content_blocks`, `services`, `packages`, `faqs`, `process_steps`, `client_categories`, `clients`, `leads`, `media`, and `profiles`.
- Strict database constraints: unique slugs, HTTPS-only check constraint on `clients.website_url`, and auto-updating `updated_at` triggers.
- Row-Level Security (RLS) enabled on **all 11 tables**: anonymous users have read-only access to published content; `leads` and `profiles` are completely inaccessible to anonymous visitors.
- Storage bucket `media` with public read access and role-restricted upload access.

### Step 2: Seed Baseline Content
Populate baseline services, packages, FAQs, client categories, process steps, and site settings:
```bash
pnpm seed
```

### Step 3: Create the Initial Owner Administrator Account
Administrative accounts are created strictly through the CLI (public user registration is disabled):
```bash
pnpm run create-owner --email admin@hader.ye --password YourSecurePassword123!
```

### Step 4: Verify Database Security & RLS
Run the automated RLS policy verification suite:
```bash
pnpm test:rls
```

---

## 5. Local Development & Scripts

Start the local Next.js development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000). The application automatically redirects to the default Arabic locale at `http://localhost:3000/ar`. Access the administrative portal at `http://localhost:3000/admin`.

### Available NPM Scripts:

```bash
# Development & Build
pnpm dev              # Launch dev server on port 3000 with hot-reload
pnpm build            # Produce production-optimized bundle
pnpm start            # Run production server locally
pnpm lint             # Execute ESLint checks
pnpm typecheck        # Run TypeScript typechecker (tsc --noEmit)
pnpm format           # Format all files with Prettier & sort Tailwind classes
pnpm format:check     # Check code formatting

# Administrative Tools
pnpm seed             # Idempotently seed database records
pnpm run create-owner # Provision a new owner account

# Automated Verification & Testing
pnpm test:rls         # Test Row-Level Security enforcement
pnpm test:admin       # Test admin authentication, RBAC, and rate limits
pnpm test:step4       # Verify content modules CRUD
pnpm test:step5       # Verify client showcase CRUD & URL validator
pnpm test:step6       # Verify public pages rendering & bilingual fallback
pnpm test:step7       # Verify lead submission pipeline & spam protection
pnpm test:step8       # Comprehensive audit: SEO, A11y, Security headers, links
pnpm test:e2e:smoke   # Programmatic end-to-end user journey tests
pnpm test:e2e         # Run Playwright browser-driven E2E tests
pnpm test:all         # Run full audit and smoke suite
```

---

## 6. End-to-End Testing (Playwright)

The project includes both programmatic and browser-driven end-to-end tests covering:
1. Home loading in `/ar` (RTL) and `/en` (LTR) with correct meta and landmarks.
2. Language switcher path preservation across subpages.
3. Contact form submission with honeypot and velocity protection.
4. Admin login authentication and role-based route guard.
5. Complete client lifecycle: create featured client $\rightarrow$ view on home $\rightarrow$ unpublish $\rightarrow$ confirm removal.

To run Playwright tests:
```bash
# First time setup: install Playwright chromium browser binary
npx playwright install chromium

# Run all E2E tests
pnpm test:e2e

# Run with interactive UI mode
npx playwright test --ui
```

---

## 7. Deployment to Vercel

The application is optimized for deployment on Vercel with zero-configuration serverless functions.

### Deployment Workflow:
1. **GitHub Repository:** Push the project to GitHub. The `main` branch serves as the production branch.
2. **Import Project:** In the Vercel Dashboard, select **Add New Project** and import the repository.
3. **Framework Preset:** Next.js (automatically detected).
4. **Configure Environment Variables:** Add all production keys in Vercel **Settings $\rightarrow$ Environment Variables**:
   - `NEXT_PUBLIC_SITE_URL` = `https://hader.ye`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
   - `RESEND_API_KEY` = `your-resend-key`
   - `OWNER_NOTIFICATION_EMAIL` = `founder@hader.ye`
5. **Deploy:** Click **Deploy**. Pull Requests automatically generate isolated preview deployments.

---

## 8. Custom Domain & DNS Configuration (Owner Checklist)

The canonical domain (`hader.ye` or alternative) and domain-matched email are owner tasks. Configure the following DNS records with your domain registrar:

### 1. Web Hosting DNS Records (Vercel)
| Type | Name / Host | Target / Value | TTL | Note |
| :---: | :---: | :---: | :---: | :--- |
| **A** | `@` (root) | `76.76.21.21` | Auto / 3600 | Points apex domain to Vercel edge network |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto / 3600 | Redirects `www.hader.ye` to root |

### 2. Transactional Email DNS Records (Resend)
Configure these records in your DNS dashboard to achieve 100% email deliverability and avoid spam filters:
| Type | Name / Host | Value | Priority | Note |
| :---: | :---: | :---: | :---: | :--- |
| **MX** | `send` | `feedback-smtp.resend.com` | `10` | Mail exchange for outbound dispatch |
| **TXT** | `send` | `v=spf1 include:resend.com ~all` | - | SPF authentication |
| **TXT** | `resend._domainkey` | *Provided in Resend dashboard* | - | DKIM cryptographic signature |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@hader.ye` | - | DMARC policy |

After DNS propagation (typically 1–24 hours), update `NEXT_PUBLIC_SITE_URL` in Vercel to `https://hader.ye`.

---

## 9. Supabase Backup & Restore Procedures

### Automated Backups
- **Supabase Pro / Enterprise:** Automated daily physical backups with Point-in-Time Recovery (PITR) enabled in **Project Settings $\rightarrow$ Database $\rightarrow$ Backups**.

### Manual Snapshot Export (`pg_dump`)
To take an immediate snapshot of schema and data from your local terminal:
```bash
# Set your Supabase direct connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Dump schema and data into a compressed SQL backup
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > hader_backup_$(date +%Y%m%d).sql
```

### Database Restore Procedure
To restore a snapshot into a fresh or recovered Supabase instance:
```bash
# Execute restore via psql
psql "$DATABASE_URL" < hader_backup_20261004.sql

# Run seed verification to ensure all constraints and tables exist
pnpm test:rls
```

---

## 10. Developer Guide: Extending the Platform

### How to Add a New Locale (e.g. French `fr`)
1. **Update Navigation Config (`navigation.ts`):**
   ```typescript
   export const locales = ['ar', 'en', 'fr'] as const;
   ```
2. **Add Translation Dictionary:**
   Create `messages/fr.json` containing matching UI keys.
3. **Update Fonts / RTL settings (`app/[locale]/layout.tsx`):**
   If the language requires special fonts or LTR orientation, configure font subsets and set `dir={locale === 'ar' ? 'rtl' : 'ltr'}`.
4. **Update Sitemap & Robots:**
   Add `fr` to the alternates array in `app/sitemap.ts`.

### How to Add a New Content Module (e.g. `Partners`)
1. **Create SQL Migration:**
   Create `supabase/migrations/2026100400000X_partners.sql` with table definition, RLS policies, and triggers.
2. **Add Validation Schema:**
   Add `partnerSchema` to `lib/validation/index.ts`.
3. **Create Data Layer Accessors:**
   Create `lib/data/partners.ts` providing typed `getPartners()`, `createPartner()`, `updatePartner()`, etc.
4. **Build Admin Interface:**
   Create `app/admin/partners/page.tsx`, `PartnersClient.tsx`, and `actions.ts`. Ensure all mutations call:
   ```typescript
   await requireRole(['owner', 'editor']);
   ```
5. **Add Sidebar Link:**
   Add the new module icon and route to `components/admin/AdminSidebar.tsx`.
6. **Revalidate Public Cache:**
   Call `revalidatePath('/[locale]/partners')` inside the save action for immediate on-demand cache refresh.

---

## 11. Security & Compliance

For details on the system threat model, Content Security Policy, Row-Level Security, rate-limiting algorithms, and vulnerability reporting protocols, refer to:
* **[docs/SECURITY.md](file:///c:/Users/hp/Desktop/projects/Hader/docs/SECURITY.md)**: Full security audit report and accepted risks.
* **[docs/DECISIONS.md](file:///c:/Users/hp/Desktop/projects/Hader/docs/DECISIONS.md)**: 34 Architecture Decision Records (ADRs).
* **[docs/DESIGN.md](file:///c:/Users/hp/Desktop/projects/Hader/docs/DESIGN.md)**: Design system, color tokens, and typography scale.

---

*Hader (حاضر) — Digital Presence for Premier Businesses.*
