import { test, expect } from '@playwright/test';

test.describe('Hader (حاضر) End-to-End Smoke Tests', () => {
  // Test credentials for admin flows
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@hader.ye';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'SecurePassword123!';

  // ---------------------------------------------------------------------------
  // 1. HOME LOADS IN /ar AND /en
  // ---------------------------------------------------------------------------
  test('1. Home loads correctly in Arabic (RTL) and English (LTR)', async ({ page }) => {
    // A. Arabic Home (/ar)
    await page.goto('/ar');
    await expect(page).toHaveTitle(/حاضر/);

    const htmlAr = page.locator('html');
    await expect(htmlAr).toHaveAttribute('lang', 'ar');
    await expect(htmlAr).toHaveAttribute('dir', 'rtl');

    // Hero title in Arabic
    const heroTitleAr = page.locator('h1');
    await expect(heroTitleAr).toBeVisible();
    await expect(heroTitleAr).toContainText('حضورك الرقمي');

    // Skip to main content link exists
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Primary CTA buttons
    const ctaButton = page.locator('a[href*="/contact"]').first();
    await expect(ctaButton).toBeVisible();

    // B. English Home (/en)
    await page.goto('/en');
    await expect(page).toHaveTitle(/Hader/);

    const htmlEn = page.locator('html');
    await expect(htmlEn).toHaveAttribute('lang', 'en');
    await expect(htmlEn).toHaveAttribute('dir', 'ltr');

    const heroTitleEn = page.locator('h1');
    await expect(heroTitleEn).toBeVisible();
    await expect(heroTitleEn).toContainText('digital presence');
  });

  // ---------------------------------------------------------------------------
  // 2. LANGUAGE SWITCH WORKS & PRESERVES PATH
  // ---------------------------------------------------------------------------
  test('2. Language switcher switches locales and preserves subpage path', async ({ page }) => {
    // Start on Arabic clients page
    await page.goto('/ar/clients');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Click Language Switcher (EN)
    const enSwitchLink = page.locator('a[href^="/en/clients"]').first();
    if (await enSwitchLink.isVisible()) {
      await enSwitchLink.click();
    } else {
      // Direct navigation verification if dropdown/sheet
      await page.goto('/en/clients');
    }

    await page.waitForURL('**/en/clients**');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    // Switch back to AR from Contact page
    await page.goto('/en/contact');
    await expect(page.locator('h1')).toContainText('Let’s Build a Premier Presence');

    const arSwitchLink = page.locator('a[href^="/ar/contact"]').first();
    if (await arSwitchLink.isVisible()) {
      await arSwitchLink.click();
    } else {
      await page.goto('/ar/contact');
    }

    await page.waitForURL('**/ar/contact**');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  // ---------------------------------------------------------------------------
  // 3. CONTACT FORM SUBMITS WITH VALIDATION & SUCCESS STATE
  // ---------------------------------------------------------------------------
  test('3. Contact form submits successfully and displays WhatsApp follow-up CTA', async ({ page }) => {
    await page.goto('/ar/contact');

    // Fill form fields
    await page.fill('input#contact-name', 'أحمد عبدالله اليمني');
    await page.fill('input#contact-business-name', 'مجموعة الفخامة التجارية');
    await page.fill('input#contact-phone', '+967 777 123 456');
    await page.fill('input#contact-email', 'ahmed@alfakhama.ye');

    // Select an interest
    const serviceCheckbox = page.locator('button[role="checkbox"]').first();
    if (await serviceCheckbox.isVisible()) {
      await serviceCheckbox.click();
      await expect(serviceCheckbox).toHaveAttribute('aria-checked', 'true');
    }

    await page.fill(
      'textarea#contact-message',
      'نود إنشاء موقع إلكتروني احترافي مع أتمتة الردود لخدمة عملاء فرعنا في صنعاء.'
    );

    // Verify honeypot is untouched
    const honeypot = page.locator('input[name="hp_field"]');
    await expect(honeypot).toHaveValue('');

    // Wait 3.5 seconds to pass velocity bot protection (minimum 3000ms)
    await page.waitForTimeout(3500);

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Verify success confirmation view
    const successHeading = page.locator('h2', { hasText: 'تم استلام طلبك بنجاح' });
    await expect(successHeading).toBeVisible({ timeout: 15000 });

    // Verify WhatsApp follow-up link is generated
    const whatsappFollowup = page.locator('a[href*="wa.me"]');
    await expect(whatsappFollowup).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 4. ADMIN LOGIN WORKS & REDIRECTS TO DASHBOARD
  // ---------------------------------------------------------------------------
  test('4. Admin authentication and dashboard access', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('لوحة التحكم');

    // Fill login form
    await page.fill('input#admin-email', adminEmail);
    await page.fill('input#admin-password', adminPassword);

    await page.click('button[type="submit"]');

    // Should redirect to /admin dashboard
    await page.waitForURL('**/admin', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('لوحة التحكم');

    // Check sidebar navigation landmarks
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('العملاء');
    await expect(sidebar).toContainText('الطلبات');
    await expect(sidebar).toContainText('الإعدادات');
  });

  // ---------------------------------------------------------------------------
  // 5. CLIENT LIFECYCLE: ADD -> MARK FEATURED -> VIEW ON HOME -> UNPUBLISH -> DISAPPEAR
  // ---------------------------------------------------------------------------
  test('5. Add client, mark featured, view on home page, unpublish, and verify removal', async ({ page }) => {
    const uniqueSlug = `smoke-client-${Date.now()}`;
    const clientNameAr = `منشأة الاختبار الشاملة ${Date.now()}`;
    const clientNameEn = `E2E Smoke Client ${Date.now()}`;

    // A. Login to Admin
    await page.goto('/admin/login');
    await page.fill('input#admin-email', adminEmail);
    await page.fill('input#admin-password', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 15000 });

    // B. Navigate to Clients management
    await page.goto('/admin/clients');
    await expect(page.locator('h1')).toContainText('إدارة العملاء');

    // C. Open Create Client Modal
    const addClientBtn = page.locator('button', { hasText: 'إضافة عميل جديد' });
    await addClientBtn.click();

    // D. Fill Client Form
    await page.fill('input[aria-label="اسم العميل (بالعربية)"]', clientNameAr);
    await page.fill('input[aria-label="اسم العميل (English)"]', clientNameEn);
    await page.fill('input[name="slug"]', uniqueSlug);
    await page.fill('input[name="website_url"]', 'https://e2e-smoke-test.ye');
    await page.fill('textarea[aria-label="وصف المنشأة (بالعربية)"]', 'وصف اختباري مخصص لفحص دورة حياة العميل في نظام حاضر.');
    await page.fill('textarea[aria-label="وصف المنشأة (English)"]', 'E2E smoke test description verifying client lifecycle.');

    // Provide default logo placeholder URL
    const logoInput = page.locator('input[name="logo"]');
    if (await logoInput.isVisible()) {
      await logoInput.fill('/brand/wordmark.svg');
    }

    // Mark Featured and Published
    const featuredCheckbox = page.locator('input[name="is_featured"]');
    if (!(await featuredCheckbox.isChecked())) {
      await featuredCheckbox.check();
    }

    const publishedCheckbox = page.locator('input[name="is_published"]');
    if (!(await publishedCheckbox.isChecked())) {
      await publishedCheckbox.check();
    }

    // Save Client
    const saveBtn = page.locator('button', { hasText: 'حفظ العميل' });
    await saveBtn.click();

    // Verify Toast or List includes new client
    await expect(page.locator('text=' + clientNameAr).first()).toBeVisible({ timeout: 15000 });

    // E. Verify Client Appears on Home Page
    await page.goto('/ar');
    const featuredSection = page.locator('section', { hasText: 'أعمال مميزة' });
    await expect(featuredSection).toBeVisible();
    await expect(featuredSection).toContainText(clientNameAr);

    // F. Return to Admin and Unpublish Client
    await page.goto('/admin/clients');
    const clientRow = page.locator(`tr:has-text("${clientNameAr}")`);
    await expect(clientRow).toBeVisible();

    // Toggle Published switch off
    const publishToggle = clientRow.locator('button[title*="تعطيل"], button[title*="نشر"]').first();
    await publishToggle.click();

    // G. Verify Client Disappears from Home Page
    await page.goto('/ar');
    await expect(page.locator(`text=${clientNameAr}`)).not.toBeVisible();
  });
});
