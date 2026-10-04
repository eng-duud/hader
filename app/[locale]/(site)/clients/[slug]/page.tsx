import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getClientBySlug } from '@/lib/data/clients';
import { getLocalizedText } from '@/lib/utils/content-helper';
import { Link } from '@/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Star,
  Globe,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

interface ClientDetailPageProps {
  params: {
    locale: 'ar' | 'en';
    slug: string;
  };
}

export async function generateMetadata({
  params: { locale, slug },
}: ClientDetailPageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';
  const client = await getClientBySlug(slug);
  if (!client || !client.is_published) {
    return { title: 'Client Not Found' };
  }

  const name = getLocalizedText(client.name_ar, client.name_en, locale);
  const desc = getLocalizedText(client.description_ar, client.description_en, locale);
  const title = `${name} | حاضر لخدمات الأعمال`;
  const ogImages = client.cover_image
    ? [{ url: client.cover_image, width: 1200, height: 630, alt: name }]
    : [];

  return {
    title,
    description: desc,
    alternates: {
      canonical: `${siteUrl}/${locale}/clients/${slug}`,
      languages: {
        ar: `${siteUrl}/ar/clients/${slug}`,
        en: `${siteUrl}/en/clients/${slug}`,
      },
    },
    openGraph: {
      title,
      description: desc,
      url: `${siteUrl}/${locale}/clients/${slug}`,
      locale: locale === 'ar' ? 'ar_YE' : 'en_US',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: ogImages.map((img) => img.url),
    },
  };
}

export default async function ClientDetailPage({
  params: { locale, slug },
}: ClientDetailPageProps) {
  const client = await getClientBySlug(slug);

  if (!client || !client.is_published) {
    notFound();
  }

  const name = getLocalizedText(client.name_ar, client.name_en, locale);
  const desc = getLocalizedText(client.description_ar, client.description_en, locale);
  const catName = client.category
    ? getLocalizedText(client.category.name_ar, client.category.name_en, locale)
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Back Link */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-typography-muted hover:text-brand-accent transition-colors"
        >
          {locale === 'ar' ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
          <span>{locale === 'ar' ? 'العودة لكافة الأعمال' : 'Back to all clients'}</span>
        </Link>
      </div>

      {/* Header Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border-subtle pb-8">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 rounded-2xl border border-border-subtle bg-surface-panel p-2 shadow-md flex items-center justify-center overflow-hidden">
            {client.logo ? (
              <Image
                src={client.logo}
                alt={`${name} logo`}
                width={64}
                height={64}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Briefcase className="h-8 w-8 text-brand-accent" />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              {catName && (
                <span className="text-xs font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full border border-brand-accent/20">
                  {catName}
                </span>
              )}
              {client.is_featured && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{locale === 'ar' ? 'مشروع مميز' : 'Featured Client'}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-typography-primary">
              {name}
            </h1>
          </div>
        </div>

        <div>
          <a
            href={client.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-primary text-brand-primary-foreground text-sm font-bold shadow-md hover:bg-brand-primary-hover transition-colors"
          >
            <span>{locale === 'ar' ? 'زيارة الموقع الحي' : 'Visit Live Website'}</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Main Showcase / Cover Image */}
      {client.cover_image && (
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-border-subtle shadow-xl bg-surface-sunken">
          <Image
            src={client.cover_image}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      )}

      {/* Description & Project Details */}
      <div className="rounded-3xl border border-border-subtle bg-surface-panel p-8 sm:p-12 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-typography-primary">
          {locale === 'ar' ? 'نظرة عامة على المشروع والنتائج' : 'Project Overview & Results'}
        </h2>

        <p className="text-base sm:text-lg leading-relaxed text-typography-muted whitespace-pre-line">
          {desc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand-accent shrink-0" />
            <span className="text-sm font-semibold text-typography-primary">
              {locale === 'ar' ? 'موقع إلكتروني فائق السرعة متوافق مع كافة الأجهزة' : 'High-speed responsive website across all devices'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand-accent shrink-0" />
            <span className="text-sm font-semibold text-typography-primary">
              {locale === 'ar' ? 'توثيق رسمي وتثبيت دقيق على خرائط جوجل' : 'Verified Google Maps location & local presence'}
            </span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="rounded-3xl bg-surface-elevated border border-border-subtle p-8 sm:p-10 text-center space-y-4">
        <h3 className="text-xl font-bold text-typography-primary">
          {locale === 'ar' ? 'هل ترغب في حضور رقمي مماثل لمنشأتك؟' : 'Want a similar digital presence for your venue?'}
        </h3>
        <p className="text-sm text-typography-muted max-w-lg mx-auto">
          {locale === 'ar'
            ? 'تواصل معنا وسنجهز لك حلاً رقمياً متكاملاً يعزز مكانتك في السوق اليمني.'
            : 'Contact us and we will prepare a comprehensive digital presence tailored for you.'}
        </p>
        <div className="pt-2">
          <Link
            href={`/contact?client=${client.slug}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-surface-canvas font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <span>{locale === 'ar' ? 'طلب عرض مخصص' : 'Request Proposal'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
