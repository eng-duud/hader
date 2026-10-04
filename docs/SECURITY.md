# Hader (حاضر) Security Architecture & Audit Report

**Document Version:** 1.0.0  
**Last Updated:** October 2026  
**Status:** Approved & Verified (Step 8 Audit Complete)  
**Scope:** Public Web Application, Admin Management Portal, Data Access Layer, Storage, and External Integrations.

---

## 1. Executive Summary

This document details the security posture, defense-in-depth architecture, automated verification results, and accepted risks for the Hader (`حاضر`) enterprise digital presence platform.

The system is designed with a **zero-trust, server-enforced security model**: client-side controls are considered UX conveniences, while all critical security, authorization, data validation, and rate-limiting rules execute strictly on the server or database tier.

---

## 2. Security Architecture & Threat Vectors

### 2.1 Threat Model Overview

```
                      +------------------------------------------+
                      |         Untrusted Web Clients            |
                      +------------------------------------------+
                                    |                 |
                        (Public Browsing)     (Admin Console / API)
                                    |                 |
                                    v                 v
                      +------------------------------------------+
                      |         Edge & Reverse Proxy             |
                      |  - HTTP Security Headers & CSP           |
                      |  - Anti-Spam Rate Limiting (IP Window)   |
                      |  - Next.js Middleware Route Guards       |
                      +------------------------------------------+
                                    |                 |
                                    v                 v
                      +------------------------------------------+
                      |           Next.js Server Layer           |
                      |  - Server Actions ('use server')         |
                      |  - Session & RBAC Verification           |
                      |  - Zod Input Parsing & Sanitization      |
                      |  - Honeypot & Timestamp Verification     |
                      +------------------------------------------+
                                    |                 |
                      (Authenticated Anon / User)  (Service Role ONLY)
                                    |                 |
                                    v                 v
                      +------------------------------------------+
                      |             Supabase Platform            |
                      |  - PostgreSQL Row-Level Security (RLS)   |
                      |  - Role Constraints (Owner vs Editor)    |
                      |  - Storage Bucket MIME & Size Limits     |
                      +------------------------------------------+
```

---

## 3. Defense Layers & Implementation Details

### 3.1 Row-Level Security (RLS) & Database Hardening
- **Zero Public Mutation Access:** No anonymous client (`anon` role) has `INSERT`, `UPDATE`, or `DELETE` permissions on any database table.
- **Leads Protection:** The `leads` table completely forbids `SELECT`, `UPDATE`, and `DELETE` from anonymous users. Ingestion occurs strictly via server actions utilizing the isolated Supabase service-role client.
- **Granular RBAC:** Authenticated users have permissions governed by their assigned profile role (`owner` vs `editor`):
  - `owner`: Unrestricted administrative read/write access across all system entities, user profiles, and global site settings.
  - `editor`: Read/write access to business content (services, packages, FAQs, process steps, clients, media), read-only access to leads, and no access to user administration or system settings.
- **Database Constraints:** 
  - Unique slug constraints across `clients`, `services`, `packages`, and `client_categories`.
  - Check constraint enforcing HTTPS-only URLs on `clients.website_url`.
  - Automated `updated_at` triggers on record mutations.

### 3.2 Authentication & Session Protection
- **Supabase SSR Auth:** Authentication is managed via `@supabase/ssr` utilizing secure HTTP-only, `SameSite=Lax`, encrypted session cookies.
- **Brute-Force & Rate Limiting:**
  - Login endpoint enforces an IP + Email sliding window rate limiter (max 5 failed attempts per 15-minute window).
  - Generic non-enumerating error messages (`"البريد الإلكتروني أو كلمة المرور غير صحيحة"`) prevent user enumeration.
- **Server-Side Verification:**
  - Route-level middleware interceptor verifies user authentication before serving `/admin/*` routes.
  - Every individual server action re-verifies session validity and role permissions (`requireRole(['owner'])` or `requireRole(['owner', 'editor'])`). Client UI checks are treated merely as visual indicators.

### 3.3 HTTP Defensive Headers & Content Security Policy (CSP)
Configured in `next.config.mjs` and enforced across every production HTTP response:

| Header Name | Value | Defense Objective |
| :--- | :--- | :--- |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-confusion attacks and malicious script execution. |
| `X-Frame-Options` | `DENY` | Blocks embedding in iframes; prevents clickjacking attacks. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Strips path and query information on cross-origin requests. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Disables risky browser APIs and invasive tracking capabilities. |
| `X-XSS-Protection` | `1; mode=block` | Activates legacy browser anti-XSS filtering. |
| `Content-Security-Policy` | Detailed below | Strictly whitelists script, style, image, font, and frame origins. |

#### Content Security Policy Breakdown:
```http
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: blob: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://*.supabase.co https://api.resend.com https://challenges.cloudflare.com; 
  frame-src https://challenges.cloudflare.com; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self';
```

### 3.4 Search Engine & Crawl Isolation (Admin Portal)
Admin isolation is guaranteed across three independent vectors:
1. **Robots Exclusion:** `app/robots.ts` explicitly disallows `/admin`, `/admin/*`, `/api/*`, and `/_next/*`.
2. **HTTP Header Tag:** Next.js middleware sets `X-Robots-Tag: noindex, nofollow` on all responses served under `/admin`.
3. **HTML Metadata:** `app/admin/layout.tsx` exports `robots: { index: false, follow: false, nocache: true }`.
4. **Sitemap Isolation:** `app/sitemap.ts` strictly excludes all admin routes.

### 3.5 Input Validation & Cross-Site Scripting (XSS) Defenses
- **Zod Schema Validation:** Every server action parses payloads through comprehensive Zod schemas (`lib/validation/index.ts`). Invalid payloads fail with structured error responses before hitting the data layer.
- **Safe Markdown Rendering:** Public pages render user-supplied markdown content (e.g. Privacy Policy, Terms of Service) using `renderSafeMarkdown` (`lib/utils/sanitize.ts`), which escapes all raw HTML tags and strictly validates link protocols against `https://` allowlists.
- **Link Security:** Every external link opening in a new browser tab (`target="_blank"`) is verified to include `rel="noopener noreferrer"`. This prevents reverse tab-napping and unauthorized `window.opener` execution.

### 3.6 Media Storage & Upload Safety
Implemented in `app/admin/media/actions.ts`:
- **Role Verification:** Upload and deletion mutations require `['owner', 'editor']` roles.
- **File Size Gate:** Hard limit of 5MB (`MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024`).
- **MIME Allowlist:** Only `image/jpeg`, `image/png`, `image/webp`, and `image/svg+xml` are accepted.
- **SVG Sanitization:** All uploaded SVG files are passed through `sanitizeHtml` to strip executable JavaScript, `<script>` tags, and dangerous XML handlers before storage.
- **Path Traversal Protection:** Uploaded filenames are sanitized (`sanitizeFilename`), stripping path separators (`/`, `\`) and non-alphanumeric characters, combined with cryptographically generated random timestamps to prevent collision and filesystem overwrite attacks.

### 3.7 Public Form Spam & Abuse Mitigation
Contact form submissions (`app/[locale]/(site)/contact/actions.ts`) are protected by a multi-layered defense:
1. **Hidden Honeypot Field (`hp_field`):** Undetectable to sighted human users; automated bots filling this field are silently rejected.
2. **Time-to-Submit Verification:** Form submissions completing in under 3 seconds from page load (`MIN_SUBMISSION_TIME_MS`) are blocked as automated script executions.
3. **Sliding-Window IP Rate Limiter:** Limits submissions to 5 per IP per rolling hour (`lib/security/spam-protection.ts`).
4. **Optional Cloudflare Turnstile:** Zero-friction CAPTCHA verification support enabled dynamically when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are provided.

### 3.8 Secret & Service Role Key Isolation
- The Supabase service-role key (`SUPABASE_SERVICE_ROLE_KEY`) and Resend API key (`RESEND_API_KEY`) are stored in environment variables without the `NEXT_PUBLIC_` prefix.
- Client bundles are verified to contain zero references to service keys.
- `lib/supabase/admin.ts` incorporates a runtime client-side execution guard:
  ```typescript
  if (typeof window !== 'undefined') {
    throw new Error('Security Violation: createAdminClient can only be called server-side.');
  }
  ```

---

## 4. Security Audit Checklist & Verification

| Check Item | Status | Verification Mechanism |
| :--- | :---: | :--- |
| All database tables protected by RLS | Passed | Verified in `scripts/test-rls.ts` and migration SQLs |
| Admin routes inaccessible to unauthenticated users | Passed | Verified via `middleware.ts` & `AdminRootLayout` |
| Admin mutations protected by server-side role check | Passed | Inspected all 11 admin action handlers |
| Form inputs validated with Zod schemas | Passed | Verified in `lib/validation/index.ts` |
| SVG uploads sanitized for malicious scripts | Passed | Verified in `app/admin/media/actions.ts` |
| Media upload MIME allowlist & 5MB size limit enforced | Passed | Verified in `app/admin/media/actions.ts` |
| Login brute-force rate limiting active | Passed | Verified in `lib/auth/rate-limiter.ts` |
| Contact form protected by honeypot & time limit | Passed | Verified in `app/[locale]/(site)/contact/actions.ts` |
| External links enforce `rel="noopener noreferrer"` | Passed | Audited 16 instances across codebase |
| Service role key isolated from browser bundles | Passed | Confirmed no `NEXT_PUBLIC_` leakage & runtime guard |
| Security headers (CSP, HSTS, X-Frame-Options) configured | Passed | Verified in `next.config.mjs` |
| Admin pages excluded from robots & sitemap | Passed | Verified in `app/robots.ts` & `app/sitemap.ts` |
| Cookies set with HttpOnly, Secure, SameSite=Lax | Passed | Managed by `@supabase/ssr` |

---

## 5. Accepted Risks & Architectural Trade-offs

1. **In-Memory Rate Limiting:**
   - *Risk:* The login rate limiter (`lib/auth/rate-limiter.ts`) and contact form IP limiter (`lib/security/spam-protection.ts`) utilize an in-memory sliding window cache. If deployed across multiple serverless instances or containers without sticky sessions, rate-limit counters are partitioned per instance.
   - *Rationale & Mitigation:* For the current target deployment (single Next.js production node or Vercel edge deployment with modest traffic), in-memory rate limiting delivers high performance without third-party Redis dependency. Upgrading to Upstash Redis or Supabase-backed rate limiting is documented in `docs/DECISIONS.md` as an optional enhancement for large-scale distributed deployments.
2. **CSP Inline Styles (`'unsafe-inline'`):**
   - *Risk:* `style-src` includes `'unsafe-inline'` to accommodate dynamic Tailwind classes, theme transitions, and Next.js CSS hydration.
   - *Rationale & Mitigation:* Next.js App Router injects critical CSS inlined in the document head for optimal First Contentful Paint (FCP). Scripts are strictly governed without `'unsafe-eval'` in production, and DOM injection vectors are sanitized, mitigating the risk of CSS-based exfiltration.
3. **Turnstile Optional Fallback:**
   - *Risk:* When Cloudflare Turnstile environment variables are omitted, the form relies solely on honeypots, timing checks, and IP rate limiting.
   - *Rationale & Mitigation:* Enables zero-friction local development and low-overhead staging deployments. Production environments should supply Turnstile keys for full CAPTCHA verification.

---

## 6. Incident Response & Vulnerability Reporting

Any security vulnerability discovered in the Hader website or infrastructure should be reported directly to:
- **Email:** `security@hader.ye`
- **Response SLA:** Initial acknowledgment within 24 hours; patch and mitigation deployment within 72 hours for high-severity findings.
