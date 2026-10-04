import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Cairo, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { locales } from '@/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/app/globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

import { getSiteSettings } from '@/lib/data/settings';
import { FloatingWhatsApp } from '@/components/public/FloatingWhatsApp';
import { AnalyticsBeacon } from '@/components/analytics/AnalyticsBeacon';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    getSiteSettings(),
  ]);

  const title = locale === 'ar'
    ? settings?.seo_title_ar || `${t('brandName')} — ${t('tagline')}`
    : settings?.seo_title_en || `${t('brandName')} — ${t('tagline')}`;
  const description = locale === 'ar'
    ? settings?.seo_description_ar || t('tagline')
    : settings?.seo_description_en || t('tagline');

  return {
    title: {
      default: title,
      template: `%s | ${t('brandName')}`,
    },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: '/ar',
        en: '/en',
      },
    },
    openGraph: {
      title,
      description,
      locale: locale === 'ar' ? 'ar_YE' : 'en_US',
      type: 'website',
      images: settings?.og_image_url ? [{ url: settings.og_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: settings?.og_image_url ? [settings.og_image_url] : [],
    },
  };
}

export default async function RootLocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const [messages, settings] = await Promise.all([
    getMessages(),
    getSiteSettings(),
  ]);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: locale === 'ar' ? settings?.company_name_ar || 'حاضر' : settings?.company_name_en || 'Hader',
    url: siteUrl,
    logo: `${siteUrl}/brand/wordmark.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings?.phone || '+967 770 000 000',
      contactType: 'customer service',
      areaServed: 'YE',
    },
  };

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface-base font-sans text-typography-primary antialiased selection:bg-brand-accent selection:text-surface-canvas">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Skip to Main Content Link for Keyboard Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-brand-primary-foreground focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm font-bold"
          >
            {locale === 'ar' ? 'التخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
          </a>

          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer settings={settings} locale={locale} />
          <FloatingWhatsApp phone={settings?.whatsapp} locale={locale} />
          <AnalyticsBeacon analyticsId={settings?.analytics_id} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
