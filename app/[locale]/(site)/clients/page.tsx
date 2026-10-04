import React from 'react';
import { Metadata } from 'next';
import { getPublicClients } from '@/lib/data/clients';
import { getClientCategories } from '@/lib/data/categories';
import { ClientFilterChips } from '@/components/public/ClientFilterChips';

interface ClientsPageProps {
  params: {
    locale: 'ar' | 'en';
  };
}

export async function generateMetadata({ params: { locale } }: ClientsPageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';
  const isAr = locale === 'ar';
  const title = isAr ? 'معرض العملاء والأعمال المنجزة' : 'Client Portfolio & Proven Work';
  const description = isAr
    ? 'استعرض المشروعات والمواقع الإلكترونية التي نفذتها حاضر للمنشآت الراقية في اليمن.'
    : 'Explore digital projects and websites delivered by Hader for leading businesses in Yemen.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/clients`,
      languages: {
        ar: `${siteUrl}/ar/clients`,
        en: `${siteUrl}/en/clients`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/clients`,
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

export default async function ClientsPage({ params: { locale } }: ClientsPageProps) {
  const [allClients, categories] = await Promise.all([
    getPublicClients(),
    getClientCategories(),
  ]);

  // Featured first, then sort_order
  const sortedClients = [...allClients].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return a.sort_order - b.sort_order;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
          {locale === 'ar' ? 'معرض الأعمال' : 'Our Portfolio'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-typography-primary tracking-tight">
          {locale === 'ar' ? 'منشآت يمنية حوّلنا حضورها إلى نجاح رقمي' : 'Businesses We Empowered with Digital Presence'}
        </h1>
        <p className="text-base sm:text-lg text-typography-muted leading-relaxed">
          {locale === 'ar'
            ? 'تصفح نماذج من المواقع والتجارب الرقمية الحية التي أطلقناها لعملائنا في مختلف القطاعات.'
            : 'Browse live websites and digital experiences built for our clients across various industries.'}
        </p>
      </div>

      {/* Filter Chips and Client Grid */}
      <ClientFilterChips
        categories={categories}
        clients={sortedClients}
        locale={locale}
      />
    </div>
  );
}
