import React from 'react';
import { Metadata } from 'next';
import { getContentBlocks } from '@/lib/data/content';
import { getSiteSettings } from '@/lib/data/settings';
import { renderSafeMarkdown } from '@/lib/utils/sanitize';
import { Shield } from 'lucide-react';

interface PrivacyPageProps {
  params: {
    locale: 'ar' | 'en';
  };
}

export async function generateMetadata({ params: { locale } }: PrivacyPageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';
  const isAr = locale === 'ar';
  const title = isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy & Data Protection';
  const description = isAr
    ? 'سياسة الخصوصية لشركة حاضر لحلول الأعمال الرقمية. نلتزم بأعلى معايير الأمان وحماية بيانات العملاء.'
    : 'Privacy Policy of Hader Digital Business Solutions in Yemen.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/privacy`,
      languages: {
        ar: `${siteUrl}/ar/privacy`,
        en: `${siteUrl}/en/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/privacy`,
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

export default async function PrivacyPage({ params: { locale } }: PrivacyPageProps) {
  const [contentBlocks, settings] = await Promise.all([
    getContentBlocks(),
    getSiteSettings(),
  ]);

  const block = contentBlocks['privacy.content'] || contentBlocks['privacy'];
  const companyName = locale === 'ar'
    ? settings?.company_name_ar || 'شركة حاضر لحلول الأعمال الرقمية'
    : settings?.company_name_en || 'Hader Digital Business Solutions';

  const defaultMarkdownAr = `
### 1. مقدمة عامة
تلتزم ${companyName} بحماية خصوصية بيانات عملائها وزوار موقعها الإلكتروني. توضح هذه السياسة كيفية تعاملنا مع البيانات الشخصية التي نتلقاها عبر نماذج الموقع.

### 2. البيانات التي نجمعها
نجمع حصراً البيانات التي تقدمها طواعية عبر نموذج الاتصال، وتشمل:
- الاسم الكامل واسم المنشأة التجارية
- رقم الهاتف والواتساب
- البريد الإلكتروني (إن وجد)
- تفاصيل المشروع ومتطلبات الحضور الرقمي

### 3. الغرض من استخدام البيانات
تُستخدم البيانات للأغراض التالية فقط:
- التواصل بخصوص إعداد عروض الأسعار وتنفيذ المشروعات
- تقديم الدعم الفني والمتابعة بعد الإطلاق
- لا نقوم ببيع أو تأجير أو مشاركة أي بيانات شخصية مع أي جهات خارجية لأغراض تسويقية

### 4. حماية البيانات والتشفير
نطبق تدابير تقنية وأمنية صارمة، تشمل تشفير الاتصال عبر بروتوكول HTTPS المشفر، وضوابط صارمة للوصول على مستوى قواعد البيانات لمنع أي وصول غير مصرح به.

### 5. التواصل معنا
لأي استفسارات تتعلق بسياسة الخصوصية، يرجى مراسلتنا على: [${settings?.email || 'contact@hader.ye'}](mailto:${settings?.email || 'contact@hader.ye'})
`;

  const defaultMarkdownEn = `
### 1. General Introduction
${companyName} is strictly committed to protecting the privacy and confidentiality of our clients and website visitors.

### 2. Information We Collect
We collect only the information you voluntarily provide via our contact forms:
- Full Name and Business Name
- Phone / WhatsApp number
- Email address (optional)
- Project requirements and notes

### 3. Purpose of Processing
Your information is processed strictly for:
- Responding to inquiries and preparing tailored proposals
- Ongoing support and project delivery
- We never sell, rent, or trade your data to third parties.

### 4. Data Security
We employ industry-standard security and strict HTTPS encryption to ensure all communications remain protected.

### 5. Inquiries
For any questions regarding privacy practices, please contact us at: [${settings?.email || 'contact@hader.ye'}](mailto:${settings?.email || 'contact@hader.ye'})
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
          <Shield className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-typography-primary">
            {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
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
