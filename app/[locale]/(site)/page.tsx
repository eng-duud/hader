import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { Link } from '@/navigation';
import { getSiteSettings } from '@/lib/data/settings';
import { getContentBlocks } from '@/lib/data/content';
import { getPublicServices } from '@/lib/data/services';
import { getPublicProcessSteps } from '@/lib/data/process';
import { getFeaturedClients } from '@/lib/data/clients';
import { getPublicPackages } from '@/lib/data/packages';
import { getPublicFaqs } from '@/lib/data/faqs';
import { getLocalizedBlock, getLocalizedText } from '@/lib/utils/content-helper';
import { FaqAccordion } from '@/components/public/FaqAccordion';
import { TestimonialsSection } from '@/components/public/TestimonialsSection';
import { CaseStudiesSection } from '@/components/public/CaseStudiesSection';
import {
  Globe,
  MessageSquareShare,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Star,
  Sparkles,
  Zap,
  PhoneCall,
  Clock,
  Briefcase,
  HelpCircle,
  Package as PackageIcon,
} from 'lucide-react';

interface HomePageProps {
  params: {
    locale: 'ar' | 'en';
  };
}

export async function generateMetadata({ params: { locale } }: HomePageProps): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';

  const title = locale === 'ar'
    ? settings?.seo_title_ar || 'حاضر | شريكك الرقمي في اليمن'
    : settings?.seo_title_en || 'Hader | Your Digital Partner in Yemen';
  const description = locale === 'ar'
    ? settings?.seo_description_ar || 'نبني حضورك الرقمي ونردّ على زبائنك فوراً.'
    : settings?.seo_description_en || 'We build your digital presence and answer your customers instantly.';

  const ogImages = settings?.og_image_url
    ? [{ url: settings.og_image_url, width: 1200, height: 630, alt: title }]
    : [{ url: `${siteUrl}/brand/wordmark.svg`, width: 1200, height: 630, alt: 'Hader' }];

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ar: `${siteUrl}/ar`,
        en: `${siteUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}`,
      siteName: locale === 'ar' ? 'حاضر لحلول الأعمال الرقمية' : 'Hader Digital Business Solutions',
      locale: locale === 'ar' ? 'ar_YE' : 'en_US',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
  };
}

export default async function HomePage({ params: { locale } }: HomePageProps) {
  // Parallel fetch from data layer
  const [
    settings,
    contentBlocks,
    services,
    processSteps,
    featuredClients,
    packages,
    faqs,
  ] = await Promise.all([
    getSiteSettings(),
    getContentBlocks(),
    getPublicServices(),
    getPublicProcessSteps(),
    getFeaturedClients(),
    getPublicPackages(),
    getPublicFaqs(),
  ]);

  // Initial Hero Copy from Brief section 17
  const heroTitle = getLocalizedBlock(
    contentBlocks,
    'hero.title',
    locale,
    locale === 'ar'
      ? 'نبني حضورك الرقمي… ونردّ على زبائنك فوراً'
      : 'We build your digital presence and answer your customers instantly.'
  );

  const heroSubtitle = getLocalizedBlock(
    contentBlocks,
    'hero.subtitle',
    locale,
    locale === 'ar'
      ? 'مواقع احترافية، وردود مؤتمتة على منصات التواصل مع تحويل الشكاوى لفريقك، وتثبيت منشأتك على الخريطة.'
      : 'Professional websites, automated replies on social platforms with complaints routed to your team, and your business pinned on the map.'
  );

  const heroBadge = getLocalizedBlock(
    contentBlocks,
    'hero.badge',
    locale,
    locale === 'ar' ? 'حلول الحضور الرقمي للشركات الراقية' : 'Digital Presence for Premier Businesses'
  );

  const problemTitle = getLocalizedBlock(
    contentBlocks,
    'problem.title',
    locale,
    locale === 'ar' ? 'لماذا تخسر المنشآت عملاءها في اليمن اليوم؟' : 'Why Businesses Lose Customers in Yemen Today'
  );

  const problemDescription = getLocalizedBlock(
    contentBlocks,
    'problem.description',
    locale,
    locale === 'ar'
      ? 'غياب الموقع الإلكتروني السريع وتأخر الرد على استفسارات الزبائن في وسائل التواصل يفقدك مبيعات مؤكدة يومياً.'
      : 'The lack of a fast website and delayed responses to customer inquiries on social media loses guaranteed sales every day.'
  );

  const problemPromise = getLocalizedBlock(
    contentBlocks,
    'problem.promise',
    locale,
    locale === 'ar'
      ? 'الأسئلة العادية يجيب عنها النظام، وأي شكوى تصل إلى شخص من فريقك مباشرة.'
      : 'Routine questions are answered automatically; any complaint goes straight to a person on your team.'
  );

  const ctaBanner = getLocalizedBlock(
    contentBlocks,
    'cta.banner',
    locale,
    locale === 'ar'
      ? 'جاهز لتأسيس حضور رقمي يليق بعلامتك التجارية؟ تواصل معنا اليوم وسنكون حاضرين لمساعدتك.'
      : 'Ready to establish a premier digital presence worthy of your business? Contact us today and we will be present.'
  );

  // WhatsApp link
  const rawPhone = settings?.whatsapp || settings?.phone || '+967770000000';
  const cleanPhone = rawPhone.replace(/[^\d]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    locale === 'ar'
      ? 'مرحباً حاضر، أود استشارة حول خدمات الحضور الرقمي لمنشأتي.'
      : 'Hello Hader, I would like to inquire about digital presence services.'
  )}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'ar' ? settings?.company_name_ar || 'حاضر' : settings?.company_name_en || 'Hader',
    url: `${siteUrl}/${locale}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/${locale}/clients?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    inLanguage: [
      {
        '@type': 'Language',
        name: 'Arabic',
        alternateName: 'ar',
      },
      {
        '@type': 'Language',
        name: 'English',
        alternateName: 'en',
      },
    ],
  };

  return (
    <div className="space-y-24 sm:space-y-32 py-12 md:py-20">
      {/* WebSite JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* 2. Hero Section (Brief 4.1 Block 2 & Section 17) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-4 py-1.5 text-xs sm:text-sm font-semibold text-brand-accent shadow-sm animate-fade-in">
          <Zap className="h-4 w-4 shrink-0 text-brand-accent" />
          <span>{heroBadge}</span>
        </div>

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-typography-primary sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-tight sm:leading-tight">
          {heroTitle}
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-typography-muted leading-relaxed">
          {heroSubtitle}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-8 py-4 text-base font-bold text-brand-primary-foreground shadow-lg shadow-brand-primary/20 transition-all hover:opacity-95 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            <span>{locale === 'ar' ? 'اطلب عرضاً' : 'Request a proposal'}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform rtl:rotate-180" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-8 py-4 text-base font-bold text-typography-primary shadow-sm transition-all hover:border-brand-accent hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            <span>{locale === 'ar' ? 'محادثة واتساب سريعة' : 'Instant WhatsApp Chat'}</span>
          </a>
        </div>
      </section>

      {/* 3. Problem and Promise (Brief 4.1 Block 3) */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-border-subtle bg-surface-panel p-8 sm:p-14 text-center shadow-sm overflow-hidden">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunken text-brand-accent mb-4">
            <Clock className="h-6 w-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-typography-primary max-w-2xl mx-auto">
            {problemTitle}
          </h2>

          <p className="mt-4 text-sm sm:text-base text-typography-muted max-w-2xl mx-auto leading-relaxed">
            {problemDescription}
          </p>

          <div className="mt-8 pt-8 border-t border-border-subtle max-w-2xl mx-auto">
            <div className="rounded-2xl bg-brand-accent/10 border border-brand-accent/20 p-4 sm:p-6 text-brand-accent font-bold text-sm sm:text-base leading-relaxed">
              «{problemPromise}»
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Services (Brief 4.1 Block 4) */}
      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
            {locale === 'ar' ? 'حلولنا الرئيسية' : 'Core Solutions'}
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-typography-primary">
            {locale === 'ar' ? 'خدمات تمنحك حضوراً واثقاً ومبيعات مستمرة' : 'Services That Deliver Presence & Continuous Sales'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-typography-muted">
            {locale === 'ar'
              ? 'نركز على الحلول التي تصنع فارقاً حقيقياً في نمو منشأتك وخدمة عملائك.'
              : 'Focused on high-impact digital solutions tailored for enterprise growth.'}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const isWebsites = service.slug === 'websites' || index === 0;
            const title = getLocalizedText(service.title_ar, service.title_en, locale);
            const desc = getLocalizedText(service.description_ar, service.description_en, locale);

            return (
              <div
                key={service.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                  isWebsites
                    ? 'border-2 border-brand-accent bg-surface-panel shadow-xl ring-4 ring-brand-accent/10 md:-translate-y-2'
                    : 'border border-border-subtle bg-surface-elevated shadow-sm hover:border-brand-accent/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary-foreground">
                      {index === 0 ? (
                        <Globe className="h-6 w-6" />
                      ) : index === 1 ? (
                        <MessageSquareShare className="h-6 w-6" />
                      ) : (
                        <MapPin className="h-6 w-6" />
                      )}
                    </div>

                    {isWebsites ? (
                      <span className="rounded-full bg-brand-accent text-surface-canvas text-[11px] font-bold px-3 py-1">
                        {locale === 'ar' ? 'الخدمة الأساسية' : 'Core Primary'}
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-sunken text-typography-muted border border-border-subtle text-[11px] font-medium px-3 py-1">
                        {locale === 'ar' ? 'متاح عند الطلب' : 'On Request'}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-typography-primary">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm text-typography-muted leading-relaxed">
                    {desc}
                  </p>

                  {!isWebsites && (
                    <div className="mt-4 rounded-xl bg-surface-sunken p-3 text-[11px] text-typography-muted leading-relaxed border border-border-subtle">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-accent inline me-1" />
                      <span>
                        {locale === 'ar'
                          ? 'تنفيذ مهني يضمن الاستجابة السريعة وتحويل الشكاوى المعقدة للمسؤولين مباشرة بدون ادعاء شراكات رسمية غير معلنة.'
                          : 'Professional setup with direct team escalation, ensuring reliable communication.'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <Link
                    href={`/contact?service=${service.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-accent hover:underline"
                  >
                    <span>{locale === 'ar' ? 'اطلب استشارة لهذه الخدمة' : 'Request Consultation'}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. How It Works: Process Steps (Brief 4.1 Block 5) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
            {locale === 'ar' ? 'رحلة العمل' : 'How It Works'}
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-typography-primary">
            {locale === 'ar' ? 'خطوات واضحة من الفكرة حتى استلام النتائج' : 'Clear Steps from Idea to Delivery'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-typography-muted">
            {locale === 'ar'
              ? 'نلتزم بالشفافية والسرعة في التنفيذ لتبدأ في استقبال عملائك فوراً.'
              : 'Committed to speed, transparency, and high quality delivery.'}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {processSteps.map((step) => {
            const title = getLocalizedText(step.title_ar, step.title_en, locale);
            const desc = getLocalizedText(step.description_ar, step.description_en, locale);

            return (
              <div
                key={step.id}
                className="relative rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary-foreground font-mono font-bold text-lg shadow-sm">
                    0{step.step_number}
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-typography-primary">
                    {title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-typography-muted leading-relaxed">
                    {desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-border-subtle/50 text-[11px] font-semibold text-brand-accent flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'مرحلة مضمونة' : 'Verified Milestone'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Featured Clients (Brief 4.1 Block 6) */}
      {featuredClients.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                {locale === 'ar' ? 'أعمال مميزة' : 'Featured Work'}
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-typography-primary">
                {locale === 'ar' ? 'منشآت يمنية وثقت في حلول حاضر' : 'Yemeni Businesses That Trust Hader'}
              </h2>
            </div>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-accent hover:underline"
            >
              <span>{locale === 'ar' ? 'استعراض كافة الأعمال' : 'View all clients'}</span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform rtl:rotate-180" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredClients.map((client) => {
              const name = getLocalizedText(client.name_ar, client.name_en, locale);
              const desc = getLocalizedText(client.description_ar, client.description_en, locale);
              const catName = client.category
                ? getLocalizedText(client.category.name_ar, client.category.name_en, locale)
                : null;

              return (
                <div
                  key={client.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-panel overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div>
                    {/* Visual Cover / Preview */}
                    <div className="relative aspect-video w-full bg-surface-sunken overflow-hidden border-b border-border-subtle">
                      {client.cover_image ? (
                        <Image
                          src={client.cover_image}
                          alt={name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-sunken to-surface-elevated">
                          <Briefcase className="h-10 w-10 text-brand-accent/30" />
                        </div>
                      )}

                      {/* Logo Badge Overlay */}
                      <div className="absolute start-4 bottom-3 h-14 w-14 rounded-2xl bg-surface-panel/95 p-1.5 shadow-lg backdrop-blur-md border border-border-subtle flex items-center justify-center overflow-hidden">
                        {client.logo ? (
                          <Image
                            src={client.logo}
                            alt={`${name} logo`}
                            width={48}
                            height={48}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs font-bold text-typography-muted">شعار</span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      {catName && (
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2.5 py-0.5 rounded-full border border-brand-accent/20">
                          {catName}
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-typography-primary">
                        <Link href={`/clients/${client.slug}`}>
                          {name}
                        </Link>
                      </h3>

                      <p className="text-xs sm:text-sm text-typography-muted leading-relaxed line-clamp-3">
                        {desc}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-border-subtle/50 mt-4 flex items-center justify-between">
                    <Link
                      href={`/clients/${client.slug}`}
                      className="text-xs font-semibold text-typography-secondary hover:text-typography-primary"
                    >
                      {locale === 'ar' ? 'تفاصيل المشروع' : 'View Details'}
                    </Link>

                    <a
                      href={client.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:underline py-1.5 px-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20"
                    >
                      <span>{locale === 'ar' ? 'زيارة الموقع الحي' : 'Visit live site'}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Case Studies & Testimonials (Brief 4.5: Only render when non-empty) */}
      <TestimonialsSection locale={locale} />
      <CaseStudiesSection locale={locale} />

      {/* 7. Packages (Brief 4.1 Block 7) */}
      <section id="packages" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
            {locale === 'ar' ? 'باقات الحضور الرقمي' : 'Digital Presence Packages'}
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-typography-primary">
            {locale === 'ar' ? 'خطط متكاملة تناسب طموح منشأتك' : 'Comprehensive Plans Tailored for Your Growth'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-typography-muted">
            {locale === 'ar'
              ? 'اختر الخطة المناسبة أو تواصل معنا لتجهيز عرض مخصص لاحتياجاتك.'
              : 'Choose the best plan or contact us for a customized solution.'}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg) => {
            const name = getLocalizedText(pkg.name_ar, pkg.name_en, locale);
            const desc = getLocalizedText(pkg.description_ar, pkg.description_en, locale);
            const features = (locale === 'ar' ? pkg.features_ar : pkg.features_en) || [];
            const hasPrice = pkg.price_cents !== null && pkg.price_cents !== undefined && pkg.price_cents > 0;
            const priceFormatted = hasPrice
              ? (pkg.price_cents! / 100).toLocaleString(locale === 'ar' ? 'ar-YE' : 'en-US')
              : null;

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                  pkg.is_highlighted
                    ? 'border-2 border-brand-accent bg-surface-panel shadow-2xl ring-4 ring-brand-accent/15 md:-translate-y-2'
                    : 'border border-border-subtle bg-surface-elevated shadow-sm hover:border-brand-accent/40'
                }`}
              >
                {pkg.is_highlighted && (
                  <div className="absolute -top-3.5 start-1/2 -translate-x-1/2 rounded-full bg-brand-accent px-4 py-1 text-xs font-bold text-surface-canvas shadow-md">
                    {locale === 'ar' ? 'الأكثر طلباً' : 'Most Popular'}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-typography-primary">{name}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-typography-muted leading-relaxed">{desc}</p>

                  <div className="mt-6 pb-6 border-b border-border-subtle">
                    {hasPrice ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-typography-primary">
                          {priceFormatted}
                        </span>
                        <span className="text-xs font-bold text-typography-muted">
                          {locale === 'ar' ? 'ريال يمني' : pkg.currency || 'YER'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xl font-bold text-brand-accent">
                        {locale === 'ar' ? 'تواصل معنا للتسعير' : 'Contact us for pricing'}
                      </div>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3">
                    {features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-typography-muted">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-accent mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <Link
                    href={`/contact?package=${pkg.slug}`}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${
                      pkg.is_highlighted
                        ? 'bg-brand-accent text-surface-canvas hover:opacity-95 shadow-md'
                        : 'bg-surface-sunken text-typography-primary hover:bg-surface-panel border border-border-subtle'
                    }`}
                  >
                    <span>{locale === 'ar' ? 'طلب هذه الباقة' : 'Request this plan'}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FAQ Accordion (Brief 4.1 Block 8) */}
      <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
            {locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-typography-primary">
            {locale === 'ar' ? 'إجابات على أكثر ما يشغل بال عملائنا' : 'Answers to What Clients Ask Most'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-typography-muted">
            {locale === 'ar'
              ? 'كل ما تود معرفته عن المدة، الضمانات، وكيفية إطلاق حضورك الرقمي.'
              : 'Everything you need to know about timeline, guarantees, and launches.'}
          </p>
        </div>

        <FaqAccordion faqs={faqs} locale={locale} />
      </section>

      {/* 9. Final CTA Banner (Brief 4.1 Block 9) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-brand-primary px-8 py-14 sm:p-16 text-center text-brand-primary-foreground shadow-2xl overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              {locale === 'ar' ? 'هل أنت مستعد لنقل عملك إلى الواجهة؟' : 'Ready to Bring Your Business to the Forefront?'}
            </h2>
            <p className="text-base sm:text-lg text-brand-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
              {ctaBanner}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-8 py-4 text-base font-bold text-surface-canvas shadow-lg hover:opacity-95 transition-opacity"
              >
                <span>{locale === 'ar' ? 'اطلب عرضك المخصص الآن' : 'Request Your Proposal Now'}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform rtl:rotate-180" />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-colors"
              >
                <span>{locale === 'ar' ? 'مراسلة واتساب مباشرة' : 'Direct WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
