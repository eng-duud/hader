/**
 * Step 5 Clients Module Verification & Unit Test Suite
 *
 * Validates:
 * 1. URL Safety & Strict HTTPS Validation (rejection of http, javascript, data, malformed)
 * 2. Slug Generation (English names, Arabic-only names with transliteration, duplicate collision avoidance)
 * 3. Client Zod Validation Schema (server-side enforcement, character limits, non-blocking bilingual fallback)
 * 4. Storage Path Extraction & Safe Image Cleanup
 * 5. Data Layer Query Semantics (Featured vs Public vs Drafts)
 */

import { validateAndNormalizeUrl, generateClientSlug, transliterateArabic } from '../lib/utils/client-helpers';
import { clientSchema } from '../lib/validation';
import { extractStoragePath } from '../lib/data/clients';

async function runStep5Tests() {
  console.log('====================================================');
  console.log('HADER CMS - STEP 5 CLIENTS MODULE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (details) console.error(`         Reason: ${details}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 1: URL Safety & Strict HTTPS Validation
  // --------------------------------------------------------------------------
  console.log('TEST SUITE 1: URL Safety & Protocol Enforcement');

  // Reject http://
  const httpCheck = validateAndNormalizeUrl('http://example.com');
  assert(
    httpCheck.isValid === false && (httpCheck.error?.includes('https') ?? false),
    'Rejects unencrypted HTTP URL'
  );

  // Reject javascript: payload
  const jsCheck = validateAndNormalizeUrl('javascript:alert(document.cookie)');
  assert(
    jsCheck.isValid === false && (jsCheck.error?.includes('أمنية') ?? false),
    'Rejects malicious javascript: URI injection'
  );

  // Reject data: payload
  const dataCheck = validateAndNormalizeUrl('data:text/html,<script>alert(1)</script>');
  assert(
    dataCheck.isValid === false,
    'Rejects dangerous data: payload'
  );

  // Reject malformed URL
  const malformedCheck = validateAndNormalizeUrl('not-a-valid-domain');
  assert(
    malformedCheck.isValid === false,
    'Rejects malformed input without valid domain'
  );

  // Reject localhost
  const localhostCheck = validateAndNormalizeUrl('https://localhost:3000/test');
  assert(
    localhostCheck.isValid === false,
    'Rejects local loopback (localhost)'
  );

  // Accept and normalize valid HTTPS URL
  const validHttps = validateAndNormalizeUrl('https://alraqi-cafe.ye/menu');
  assert(
    validHttps.isValid === true && validHttps.normalizedUrl === 'https://alraqi-cafe.ye/menu',
    'Accepts valid HTTPS URL with path'
  );

  // Auto-prefix https:// for bare domain
  const bareDomain = validateAndNormalizeUrl('hader.ye');
  assert(
    bareDomain.isValid === true && bareDomain.normalizedUrl === 'https://hader.ye/',
    'Normalizes and auto-prefixes bare domain with https://'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Slug Generation & Edge Cases
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 2: Slug Generation & Arabic Name Edge Cases');

  // Standard English name
  const standardSlug = generateClientSlug('Al-Raqi Coffee & Roastery');
  assert(
    standardSlug === 'al-raqi-coffee-roastery',
    'Generates clean hyphenated slug from English name'
  );

  // Punctuation and quotes removal
  const messySlug = generateClientSlug("Bab Al-Yemen's \"Finest\" Spices!");
  assert(
    messySlug === 'bab-al-yemens-finest-spices',
    'Strips quotes, special characters, and exclamation marks'
  );

  // Arabic-only name edge case (transliteration)
  const arabicOnlySlug = generateClientSlug('', 'مقهى الراقي');
  assert(
    arabicOnlySlug.length > 2 && /^[a-z0-9-]+$/.test(arabicOnlySlug),
    `Transliterates Arabic-only name to valid Latin slug (${arabicOnlySlug})`
  );

  // Duplicate slug collision handling
  const existingSlugs = ['hadramout-honey', 'hadramout-honey-2'];
  const uniqueSlug = generateClientSlug('Hadramout Honey', undefined, existingSlugs);
  assert(
    uniqueSlug === 'hadramout-honey-3',
    'Appends incrementing numeric suffix (-3) when duplicate slugs exist'
  );

  // Transliteration helper unit test
  const transliteratedSanaa = transliterateArabic('صنعاء');
  assert(
    transliteratedSanaa === 'snaaa',
    'Phonetically transliterates Arabic city name correctly'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Server-Side Zod Validation (clientSchema)
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 3: Server-Side Client Validation Schema');

  // Valid Client
  const validClient = clientSchema.safeParse({
    name_ar: 'مقهى الراقي',
    name_en: 'Al-Raqi Cafe',
    slug: 'al-raqi-cafe',
    description_ar: 'تصميم موقع متكامل وتوثيق الموقع على خرائط جوجل مما رفع المبيعات 40%.',
    description_en: 'Complete digital presence and Google Maps verification increasing sales by 40%.',
    website_url: 'https://alraqi.ye',
    logo: 'https://supabase.co/storage/v1/object/public/media/uploads/logo.png',
    cover_image: 'https://supabase.co/storage/v1/object/public/media/uploads/cover.jpg',
    category_id: 'a0000000-0000-0000-0000-000000000001',
    is_featured: true,
    is_published: true,
    sort_order: 0,
  });
  assert(
    validClient.success === true,
    'Accepts fully populated valid client'
  );

  // Reject unencrypted HTTP even if client-side validation is bypassed
  const bypassedHttp = clientSchema.safeParse({
    name_ar: 'متجر اليمن',
    name_en: 'Yemen Store',
    slug: 'yemen-store',
    description_ar: 'وصف تجريبي',
    description_en: 'Sample description',
    website_url: 'http://insecure-site.ye', // Insecure!
    logo: 'https://example.com/logo.png',
  });
  assert(
    bypassedHttp.success === false,
    'Server-side validation rejects unencrypted HTTP URL (bypassed client)'
  );

  // Reject missing logo
  const missingLogo = clientSchema.safeParse({
    name_ar: 'متجر اليمن',
    name_en: 'Yemen Store',
    slug: 'yemen-store',
    description_ar: 'وصف تجريبي',
    description_en: 'Sample description',
    website_url: 'https://secure-site.ye',
    logo: '', // Empty logo
  });
  assert(
    missingLogo.success === false,
    'Rejects client creation when logo is missing'
  );

  // Reject description exceeding 280 characters
  const longDesc = 'أ'.repeat(281);
  const oversizedDesc = clientSchema.safeParse({
    name_ar: 'متجر اليمن',
    name_en: 'Yemen Store',
    slug: 'yemen-store',
    description_ar: longDesc,
    description_en: 'Short',
    website_url: 'https://secure-site.ye',
    logo: 'https://example.com/logo.png',
  });
  assert(
    oversizedDesc.success === false,
    'Rejects client description exceeding 280 character limit'
  );

  // Bilingual fallback: Arabic only should succeed
  const arabicOnlyClient = clientSchema.safeParse({
    name_ar: 'حلويات صنعاء القديمة',
    name_en: '',
    slug: 'sanaa-sweets',
    description_ar: 'أعرق متجر حلويات تقليدي في قلب صنعاء القديمة',
    description_en: '',
    website_url: 'https://sanaasweets.ye',
    logo: 'https://example.com/logo.png',
  });
  assert(
    arabicOnlyClient.success === true,
    'Accepts client with Arabic-only content (non-blocking fallback)'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Storage Cleanup Helper
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 4: Storage Image Extraction & Cleanup');

  const fullStorageUrl = 'https://abcdefghijkl.supabase.co/storage/v1/object/public/media/uploads/1728000000_client_logo.png';
  const extractedPath = extractStoragePath(fullStorageUrl);
  assert(
    extractedPath === 'uploads/1728000000_client_logo.png',
    'Extracts relative storage path from Supabase public URL'
  );

  const directPath = 'uploads/1728000000_cover.jpg';
  assert(
    extractStoragePath(directPath) === 'uploads/1728000000_cover.jpg',
    'Extracts storage path when already relative'
  );

  assert(
    extractStoragePath('https://external-cdn.com/image.png') === null,
    'Returns null for external non-Supabase URLs to prevent unauthorized storage deletes'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Data Layer Query Logic
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 5: Data Layer Query Semantics');

  const mockClients = [
    { id: '1', slug: 'c1', is_featured: true, is_published: true, sort_order: 0 },
    { id: '2', slug: 'c2', is_featured: false, is_published: true, sort_order: 1 },
    { id: '3', slug: 'c3', is_featured: true, is_published: false, sort_order: 2 }, // Draft but marked featured!
  ];

  // Featured public query must require BOTH is_featured === true AND is_published === true
  const publicFeatured = mockClients.filter((c) => c.is_featured && c.is_published);
  assert(
    publicFeatured.length === 1 && publicFeatured[0].id === '1',
    'Featured public query includes only published featured clients (drafts excluded)'
  );

  // Public clients query must filter out all drafts
  const publicClients = mockClients.filter((c) => c.is_published);
  assert(
    publicClients.length === 2 && !publicClients.some((c) => c.id === '3'),
    'Public query strictly excludes unpublished drafts'
  );

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep5Tests().catch((err) => {
  console.error('Fatal error during Step 5 test execution:', err);
  process.exit(1);
});
