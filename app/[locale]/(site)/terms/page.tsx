import React from 'react';
import { Metadata } from 'next';
import { getContentBlocks } from '@/lib/data/content';
import { getSiteSettings } from '@/lib/data/settings';
import { renderSafeMarkdown } from '@/lib/utils/sanitize';
import { FileText } from 'lucide-react';

interface TermsPageProps {
  params: {
    locale: 'ar' | 'en';
  };
}

export async function generateMetadata({ params: { locale } }: TermsPageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';
  const isAr = locale === 'ar';
  const title = isAr ? 'شروط وأحكام الاستخدام والخدمة' : 'Terms of Service & Engagement';
  const description = isAr
    ? 'الشروط والأحكام الخاصة بالتعاقد واستخدام خدمات حاضر للحلول الرقمية.'
    : 'Terms and conditions governing the services provided by Hader in Yemen.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/terms`,
      languages: {
        ar: `${siteUrl}/ar/terms`,
        en: `${siteUrl}/en/terms`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/terms`,
      locale: isAr ? 'ar_YE' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function TermsPage({ params: { locale } }: TermsPageProps) {
  const [contentBlocks, settings] = await Promise.all([
    getContentBlocks(),
    getSiteSettings(),
  ]);

  const block = contentBlocks['terms.content'] || contentBlocks['terms'];
  const companyName = locale === 'ar'
    ? settings?.company_name_ar || 'شركة حاضر لحلول الأعمال الرقمية'
    : settings?.company_name_en || 'Hader Digital Business Solutions';

  const defaultMarkdownAr = `
### 1. قبول الشروط
باستخدامك لموقع ${companyName} أو طلبك لأي من خدماتنا الرقمية، فإنك تقر وتوافق على الالتزام بكافة الشروط والأحكام الموضحة هنا.

### 2. نطاق الخدمات
- تصميم وتطوير المواقع الإلكترونية للشركات والمنشآت التجارية.
- إعداد أنظمة الأتمتة المتقدمة للردود الذكية وتوجيه الشكاوى لفريق العمل البشري.
- توثيق وتثبيت المواقع الجغرافية بدقة على خرائط جوجل.
- نحن لا ندعي أي شراكة رسمية حصرية غير معلنة مع منصات الطرف الثالث، ونلتزم بسياسات الاستخدام المعتمدة لدى تلك المنصات.

### 3. التزامات العميل
- تزويدنا بالبيانات والشعارات والمحتوى الموثوق الخالي من أي انتهاك لحقوق الملكية الفكرية.
- اعتماد المراحل والمخرجات وفق الجداول الزمنية المتفق عليها في عقد تقديم الخدمة.

### 4. الملكية الفكرية
تنتقل كامل حقوق ملكية التصاميم والأكواد والمحتوى المعتمد للعميل فور سداد كافة المستحقات المالية الخاصة بالمشروع.

### 5. القانون الواجب التطبيق
تخضع هذه الشروط وتفسر وفقاً للقوانين والأنظمة المعمول بها في الجمهورية اليمنية.
`;

  const defaultMarkdownEn = `
### 1. Acceptance of Terms
By accessing or using the services of ${companyName}, you agree to be bound by these Terms of Service.

### 2. Scope of Services
- High-performance web development and digital presence solutions.
- Automated messaging with human-team escalation.
- Verified business location and local map presence.
- We operate in full compliance with third-party platform terms without false claims of exclusive official partnerships.

### 3. Client Responsibilities
- Supplying authentic media, branding assets, and accurate business information.
- Reviewing and approving project milestones as agreed in scope documentation.

### 4. Intellectual Property
Upon complete settlement of agreed fees, full ownership of delivered digital assets transfers to the client.

### 5. Governing Law
These terms are governed and construed under the laws and regulations of the Republic of Yemen.
`;

  const rawMarkdown = locale === 'ar'
    ? block?.value_ar || block?.value_en || defaultMarkdownAr
    : block?.value_en || block?.value_ar || defaultMarkdownEn;

  const safeHtml = renderSafeMarkdown(rawMarkdown);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border-subtle pb-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary-foreground shadow-md">
          <FileText className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-typography-primary">
            {locale === 'ar' ? 'شروط الاستخدام' : 'Terms of Service'}
          </h1>
          <p className="mt-1 text-xs text-typography-muted">
            {companyName} • {locale === 'ar' ? 'آخر تحديث: أكتوبر 2026' : 'Last updated: October 2026'}
          </p>
        </div>
      </div>

      {/* Rendered Safe Markdown */}
      <div
        className="rounded-3xl border border-border-subtle bg-surface-panel p-8 sm:p-12 shadow-sm"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}
