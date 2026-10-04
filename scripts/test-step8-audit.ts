/**
 * Automated Verification Script for Step 8: SEO, Performance, Accessibility & Security Audit
 * 
 * Run with: pnpm test:step8 or npx tsx scripts/test-step8-audit.ts
 */

import fs from 'fs';
import path from 'path';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, message: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('\n======================================================');
console.log('🚀 STEP 8: COMPREHENSIVE PROJECT AUDIT VERIFICATION');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// 1. SEO AUDIT
// -----------------------------------------------------------------------------
console.log('--- 1. SEO: Localized Metadata, Canonical URLs & Dynamic Robots/Sitemap ---');

const robotsPath = path.join(process.cwd(), 'app', 'robots.ts');
const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
assert(robotsContent.includes("disallow: ["), 'robots.ts specifies disallow rules');
assert(robotsContent.includes("'/admin'"), 'robots.ts disallows /admin');
assert(robotsContent.includes("'/api/*'"), 'robots.ts disallows /api/*');
assert(robotsContent.includes("sitemap: `${baseUrl}/sitemap.xml`"), 'robots.ts points to dynamic sitemap.xml');
assert(robotsContent.includes("process.env.NEXT_PUBLIC_SITE_URL"), 'robots.ts uses dynamic site URL from env');

const sitemapPath = path.join(process.cwd(), 'app', 'sitemap.ts');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
assert(sitemapContent.includes("getPublicClients"), 'sitemap.ts fetches published clients');
assert(sitemapContent.includes("alternates: {"), 'sitemap.ts generates hreflang alternates');
assert(sitemapContent.includes("ar: arUrl") && sitemapContent.includes("en: enUrl"), 'sitemap.ts includes ar and en for all static routes');
assert(sitemapContent.includes("arClientUrl") && sitemapContent.includes("enClientUrl"), 'sitemap.ts includes ar and en for all published client pages');

// Check JSON-LD in layout and home
const layoutPath = path.join(process.cwd(), 'app', '[locale]', 'layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
assert(layoutContent.includes("'@type': 'Organization'"), 'Organization JSON-LD embedded on all pages');
assert(layoutContent.includes("metadataBase: new URL"), 'MetadataBase configured with canonical site URL');

const homePath = path.join(process.cwd(), 'app', '[locale]', '(site)', 'page.tsx');
const homeContent = fs.readFileSync(homePath, 'utf-8');
assert(homeContent.includes("'@type': 'WebSite'"), 'WebSite JSON-LD embedded on home page');
assert(homeContent.includes("potentialAction: {"), 'SearchAction embedded in WebSite JSON-LD');
assert(homeContent.includes("alternates: {"), 'Home page exports canonical and hreflang alternates');

// -----------------------------------------------------------------------------
// 2. ACCESSIBILITY (A11Y) AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 2. Accessibility: Landmarks, Focus States, Form Associations & Reduced Motion ---');

assert(layoutContent.includes('href="#main-content"'), 'Skip-to-main-content link exists in root layout');
assert(layoutContent.includes('id="main-content"'), 'Main landmark exists with id="main-content"');
assert(layoutContent.includes('tabIndex={-1}'), 'Main landmark is focusable via keyboard skip link');

const globalsCssPath = path.join(process.cwd(), 'app', 'globals.css');
const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');
assert(globalsCss.includes('@media (prefers-reduced-motion: reduce)'), 'Prefers-reduced-motion media query implemented');
assert(globalsCss.includes(':focus-visible'), 'Global accessible :focus-visible styling implemented');

const contactFormPath = path.join(process.cwd(), 'components', 'public', 'ContactForm.tsx');
const contactForm = fs.readFileSync(contactFormPath, 'utf-8');
assert(contactForm.includes('htmlFor="contact-name"') && contactForm.includes('id="contact-name"'), 'Name input has explicit label association');
assert(contactForm.includes('htmlFor="contact-business-name"') && contactForm.includes('id="contact-business-name"'), 'Business name input has explicit label association');
assert(contactForm.includes('htmlFor="contact-phone"') && contactForm.includes('id="contact-phone"'), 'Phone input has explicit label association');
assert(contactForm.includes('htmlFor="contact-message"') && contactForm.includes('id="contact-message"'), 'Message textarea has explicit label association');
assert(contactForm.includes('aria-describedby='), 'Form inputs use aria-describedby for error messaging');
assert(contactForm.includes('role="checkbox"'), 'Custom interest buttons declare role="checkbox"');
assert(contactForm.includes('aria-checked='), 'Custom interest buttons declare aria-checked state');

// -----------------------------------------------------------------------------
// 3. SECURITY HEADERS & PERMISSIONS
// -----------------------------------------------------------------------------
console.log('\n--- 3. Security: Defensive Headers, CSP & Admin Noindex ---');

const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');
assert(nextConfig.includes("'X-Content-Type-Options'"), 'X-Content-Type-Options: nosniff header configured');
assert(nextConfig.includes("'X-Frame-Options'"), 'X-Frame-Options: DENY header configured');
assert(nextConfig.includes("'Referrer-Policy'"), 'Referrer-Policy header configured');
assert(nextConfig.includes("'Permissions-Policy'"), 'Permissions-Policy header configured');
assert(nextConfig.includes("'Content-Security-Policy'"), 'Content Security Policy (CSP) configured');
assert(nextConfig.includes("frame-ancestors 'none'"), 'CSP enforces frame-ancestors none (anti-clickjacking)');

const middlewarePath = path.join(process.cwd(), 'middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
assert(middlewareContent.includes("response.headers.set('X-Robots-Tag', 'noindex, nofollow')"), 'Middleware sets X-Robots-Tag: noindex, nofollow on admin routes');

// -----------------------------------------------------------------------------
// 4. LINK SAFETY & EXTERNAL TARGETS
// -----------------------------------------------------------------------------
console.log('\n--- 4. Link Safety: rel="noopener noreferrer" on All External Links ---');

function checkExternalLinksInDir(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      checkExternalLinksInDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('target="_blank"')) {
        const matches = content.match(/<a[^>]*target="_blank"[^>]*>/g) || [];
        for (const match of matches) {
          const hasRel = match.includes('rel="noopener noreferrer"');
          assert(hasRel, `${entry.name}: link "${match.substring(0, 45)}..." has rel="noopener noreferrer"`);
        }
      }
    }
  }
}

checkExternalLinksInDir(path.join(process.cwd(), 'app'));
checkExternalLinksInDir(path.join(process.cwd(), 'components'));

// -----------------------------------------------------------------------------
// 5. SECRETS ISOLATION & SERVICE ROLE SAFETY
// -----------------------------------------------------------------------------
console.log('\n--- 5. Secrets Isolation: No Service Role Key in Client Components ---');

const adminClientPath = path.join(process.cwd(), 'lib', 'supabase', 'admin.ts');
const adminClientContent = fs.readFileSync(adminClientPath, 'utf-8');
assert(adminClientContent.includes("typeof window !== 'undefined'"), 'admin.ts contains browser execution guard');

function checkNoClientImportsOfAdmin(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      checkNoClientImportsOfAdmin(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes("'use client'")) {
        const importsAdmin = content.includes('@/lib/supabase/admin') || content.includes('createAdminClient');
        assert(!importsAdmin, `${entry.name}: Client component does NOT import admin client or service role`);
      }
    }
  }
}

checkNoClientImportsOfAdmin(path.join(process.cwd(), 'components'));
checkNoClientImportsOfAdmin(path.join(process.cwd(), 'app'));

// -----------------------------------------------------------------------------
// 6. SERVER-SIDE ROLE ENFORCEMENT ON ADMIN ACTIONS
// -----------------------------------------------------------------------------
console.log('\n--- 6. Server Actions: Server-Side Role Checks & Validation ---');

const adminDir = path.join(process.cwd(), 'app', 'admin');
const actionFiles = [
  'categories/actions.ts',
  'clients/actions.ts',
  'content/actions.ts',
  'faqs/actions.ts',
  'leads/actions.ts',
  'media/actions.ts',
  'packages/actions.ts',
  'process/actions.ts',
  'services/actions.ts',
  'settings/actions.ts',
  'users/actions.ts',
];

for (const relAction of actionFiles) {
  const filePath = path.join(adminDir, relAction);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert(content.includes('requireRole('), `${relAction} enforces server-side role authorization`);
  }
}

// -----------------------------------------------------------------------------
// 7. SECURITY DOCUMENTATION
// -----------------------------------------------------------------------------
console.log('\n--- 7. Documentation: docs/SECURITY.md Verification ---');
const secDocPath = path.join(process.cwd(), 'docs', 'SECURITY.md');
assert(fs.existsSync(secDocPath), 'docs/SECURITY.md exists');
const secDocContent = fs.readFileSync(secDocPath, 'utf-8');
assert(secDocContent.includes('## 3. Defense Layers & Implementation Details'), 'docs/SECURITY.md details defense layers');
assert(secDocContent.includes('## 4. Security Audit Checklist & Verification'), 'docs/SECURITY.md details audit checklist');
assert(secDocContent.includes('## 5. Accepted Risks & Architectural Trade-offs'), 'docs/SECURITY.md documents accepted risks');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`🏁 AUDIT RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log('======================================================\n');

if (passedChecks === totalChecks) {
  console.log('🎉 ALL STEP 8 AUDIT CRITERIA SATISFIED!\n');
} else {
  console.error('⚠️ SOME AUDIT CRITERIA FAILED.\n');
  process.exit(1);
}
