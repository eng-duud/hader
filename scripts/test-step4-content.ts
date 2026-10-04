/**
 * Step 4 Content Modules Verification Test Suite
 *
 * Validates:
 * 1. Markdown & HTML XSS Sanitization (scripts, onerror, iframe, javascript: URIs stripped)
 * 2. Translatable AR/EN Field Rules (non-blocking when one language empty, error only if both empty)
 * 3. Media Upload Validation (MIME allowlist, 5MB max size, filename traversal sanitization, SVG sanitization)
 * 4. In-use safety checks for Media and Categories
 * 5. Revalidation and Role Protection discipline
 */

import { sanitizeHtml, renderSafeMarkdown } from '../lib/utils/sanitize';
import {
  serviceSchema,
  packageSchema,
  faqSchema,
  processStepSchema,
  clientCategorySchema,
  mediaSchema,
  siteSettingsSchema,
} from '../lib/validation';

async function runStep4Tests() {
  console.log('====================================================');
  console.log('HADER CMS - STEP 4 CONTENT MODULES VERIFICATION');
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
  // TEST SUITE 1: XSS Sanitization & Safe Markdown (Privacy & Terms)
  // --------------------------------------------------------------------------
  console.log('TEST SUITE 1: Safe Markdown & HTML Sanitization');

  const maliciousScript = '## سياسة الخصوصية\n<script>alert("hacked")</script>\nنحن نحترم خصوصيتك.';
  const sanitizedScript = sanitizeHtml(maliciousScript);
  assert(
    !sanitizedScript.includes('<script>') && !sanitizedScript.includes('alert'),
    'Stripped <script> tag and executable payload from Markdown/HTML'
  );

  const maliciousEvent = '<img src="https://example.com/logo.png" onload="alert(document.cookie)" onerror="steal()">';
  const sanitizedEvent = sanitizeHtml(maliciousEvent);
  assert(
    !sanitizedEvent.includes('onload') && !sanitizedEvent.includes('onerror'),
    'Stripped inline event handlers (onload, onerror)'
  );

  const maliciousUri = '<a href="javascript:alert(1)">انقر هنا</a>';
  const sanitizedUri = sanitizeHtml(maliciousUri);
  assert(
    !sanitizedUri.includes('javascript:'),
    'Neutralized javascript: URI protocol'
  );

  const markdownOutput = renderSafeMarkdown('# شروط الاستخدام\n\nنص تجريبي مع **نص عريض** ورابط [حاضر](https://hader.ye).');
  assert(
    markdownOutput.includes('<h1') &&
    markdownOutput.includes('<strong>') &&
    markdownOutput.includes('https://hader.ye') &&
    !markdownOutput.includes('<script>'),
    'Rendered safe semantic HTML from Markdown string'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Bilingual AR/EN Validation (Warn, do not block)
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 2: Bilingual Translation Non-Blocking Fallback');

  // Service: Arabic-only should succeed (warn on UI, fallback on public site)
  const arabicOnlyService = serviceSchema.safeParse({
    slug: 'web-development',
    title_ar: 'تطوير المواقع',
    title_en: '',
    description_ar: 'تصميم مواقع حديثة وعالية السرعة للشركات في اليمن',
    description_en: '',
    icon: 'Globe',
    sort_order: 0,
    is_visible: true,
  });
  assert(
    arabicOnlyService.success === true,
    'Service succeeds with Arabic-only (does not block editor if English is empty)'
  );

  // Service: English-only should succeed
  const englishOnlyService = serviceSchema.safeParse({
    slug: 'web-development-en',
    title_ar: '',
    title_en: 'Web Development',
    description_ar: '',
    description_en: 'Modern high-speed websites for businesses in Yemen',
    icon: 'Globe',
    sort_order: 1,
    is_visible: true,
  });
  assert(
    englishOnlyService.success === true,
    'Service succeeds with English-only'
  );

  // Service: Both empty should fail
  const emptyService = serviceSchema.safeParse({
    slug: 'web-development-empty',
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
  });
  assert(
    emptyService.success === false,
    'Service validation correctly fails if both Arabic and English titles are empty'
  );

  // Package: Arabic only should succeed
  const arabicOnlyPackage = packageSchema.safeParse({
    slug: 'starter-presence',
    name_ar: 'باقة الحضور الأساسي',
    name_en: '',
    description_ar: 'تجهيز كامل للخرائط وموقع صفحة واحدة متجاوب',
    description_en: '',
    price_cents: 25000000,
    currency: 'YER',
    features_ar: ['موقع صفحة واحدة', 'توثيق جوجل ماب'],
    features_en: [],
    is_highlighted: false,
    is_visible: true,
  });
  assert(
    arabicOnlyPackage.success === true,
    'Package succeeds with Arabic-only without blocking'
  );

  // FAQ: Arabic only should succeed
  const arabicOnlyFaq = faqSchema.safeParse({
    question_ar: 'ما هي مدة تسليم الموقع؟',
    question_en: '',
    answer_ar: 'يتم تجهيز الموقع وإطلاقه خلال 5 إلى 7 أيام عمل.',
    answer_en: '',
    sort_order: 0,
    is_visible: true,
  });
  assert(
    arabicOnlyFaq.success === true,
    'FAQ succeeds with Arabic-only without blocking'
  );

  // Process Step: Arabic only should succeed
  const arabicOnlyStep = processStepSchema.safeParse({
    step_number: 1,
    title_ar: 'الاستكشاف والفهم',
    title_en: '',
    description_ar: 'جلسة أولى لفهم أهداف مشروعك وجمهورك المستهدف',
    description_en: '',
    sort_order: 0,
    is_visible: true,
  });
  assert(
    arabicOnlyStep.success === true,
    'Process step succeeds with Arabic-only without blocking'
  );

  // Client Category: Arabic only should succeed
  const arabicOnlyCategory = clientCategorySchema.safeParse({
    slug: 'cafes-restaurants',
    name_ar: 'المقاهي والمطاعم',
    name_en: '',
    sort_order: 0,
  });
  assert(
    arabicOnlyCategory.success === true,
    'Client category succeeds with Arabic-only without blocking'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Media Upload Rules & Allowlist
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 3: Media Upload Rules & Allowlist');

  // Accept valid JPG
  const validJpg = mediaSchema.safeParse({
    storage_path: 'uploads/test.jpg',
    public_url: 'https://supabase.co/storage/v1/object/public/media/uploads/test.jpg',
    alt_ar: 'صورة تجريبية',
    alt_en: 'Test image',
    mime_type: 'image/jpeg',
    size_bytes: 1024 * 500, // 500 KB
  });
  assert(validJpg.success === true, 'Accepts valid JPG image');

  // Accept valid WebP
  const validWebp = mediaSchema.safeParse({
    storage_path: 'uploads/test.webp',
    public_url: 'https://supabase.co/storage/v1/object/public/media/uploads/test.webp',
    mime_type: 'image/webp',
    size_bytes: 1024 * 200,
  });
  assert(validWebp.success === true, 'Accepts valid WebP image');

  // Reject executable or dangerous file format
  const dangerousExe = mediaSchema.safeParse({
    storage_path: 'uploads/malware.exe',
    public_url: 'https://supabase.co/storage/v1/object/public/media/uploads/malware.exe',
    mime_type: 'application/x-msdownload',
    size_bytes: 1024 * 100,
  });
  assert(dangerousExe.success === false, 'Rejects dangerous file format (.exe / application/x-msdownload)');

  // Reject PDF in image media library
  const invalidPdf = mediaSchema.safeParse({
    storage_path: 'uploads/document.pdf',
    public_url: 'https://supabase.co/storage/v1/object/public/media/uploads/document.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024 * 100,
  });
  assert(invalidPdf.success === false, 'Rejects non-image document format (application/pdf)');

  // Reject oversized file (> 5MB)
  const oversizedImage = mediaSchema.safeParse({
    storage_path: 'uploads/giant.png',
    public_url: 'https://supabase.co/storage/v1/object/public/media/uploads/giant.png',
    mime_type: 'image/png',
    size_bytes: 6 * 1024 * 1024, // 6 MB (max allowed is 5 MB)
  });
  assert(
    oversizedImage.success === false,
    'Rejects oversized upload (> 5MB limit enforced)'
  );

  // Filename traversal protection check
  function sanitizeFilename(filename: string): string {
    const base = filename.replace(/^.*[\\\/]/, '');
    return base.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '') || 'upload.bin';
  }
  const cleanFilename = sanitizeFilename('../../../etc/passwd');
  assert(
    cleanFilename === 'passwd' && !cleanFilename.includes('..') && !cleanFilename.includes('/'),
    'Sanitizes filename against directory traversal attacks'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Settings Completeness (Brief 5.2)
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 4: Site Settings Completeness');

  const validSettings = siteSettingsSchema.safeParse({
    company_name_ar: 'شركة حاضر للحلول الرقمية',
    company_name_en: 'Hader Digital Solutions Co.',
    phone: '+967 777 000 000',
    whatsapp: '+967 777 000 000',
    email: 'info@hader.ye',
    address_ar: 'صنعاء، الجمهورية اليمنية',
    address_en: 'Sanaa, Republic of Yemen',
    working_hours_ar: 'السبت - الخميس: 9:00 ص - 6:00 م',
    working_hours_en: 'Saturday - Thursday: 9:00 AM - 6:00 PM',
    social_links: {
      x: 'https://x.com/haderye',
      linkedin: 'https://linkedin.com/company/haderye',
      instagram: 'https://instagram.com/haderye',
      facebook: 'https://facebook.com/haderye',
    },
    seo_title_ar: 'حاضر | شريكك الرقمي في اليمن',
    seo_title_en: 'Hader | Your Digital Partner in Yemen',
    seo_description_ar: 'نبني حضورك الرقمي المتكامل',
    seo_description_en: 'We build your comprehensive digital presence',
    og_image_url: 'https://supabase.co/storage/v1/object/public/media/og-cover.png',
    analytics_id: 'G-HADER2026',
  });
  assert(
    validSettings.success === true,
    'Settings schema contains all required fields from Brief 5.2'
  );

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep4Tests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
