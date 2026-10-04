import React from 'react';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { getPublicServices } from '@/lib/data/services';
import { getLocalizedText } from '@/lib/utils/content-helper';
import { ContactForm } from '@/components/public/ContactForm';
import { Mail, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';

interface ContactPageProps {
  params: {
    locale: 'ar' | 'en';
  };
  searchParams: {
    service?: string;
    package?: string;
    client?: string;
  };
}

export async function generateMetadata({ params: { locale } }: ContactPageProps): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';
  const isAr = locale === 'ar';
  const title = isAr ? 'تواصل معنا | اطلب عرض حضور رقمي' : 'Contact Us | Request Proposal';
  const description = isAr
    ? 'تواصل مع فريق حاضر لحلول الأعمال الرقمية في صنعاء. نحن جاهزون للرد على استفسارك وتجهيز عرضك.'
    : 'Connect with Hader in Sanaa. Inquire about digital presence, web solutions, and automated messaging.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/contact`,
      languages: {
        ar: `${siteUrl}/ar/contact`,
        en: `${siteUrl}/en/contact`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/contact`,
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

export default async function ContactPage({
  params: { locale },
  searchParams,
}: ContactPageProps) {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    getPublicServices(),
  ]);

  const rawPhone = settings?.phone || '+967 770 000 000';
  const rawWhatsapp = settings?.whatsapp || rawPhone;
  const email = settings?.email || 'contact@hader.ye';
  const address = getLocalizedText(settings?.address_ar, settings?.address_en, locale, 'صنعاء، الجمهورية اليمنية');
  const workingHours = getLocalizedText(
    settings?.working_hours_ar,
    settings?.working_hours_en,
    locale,
    'السبت - الخميس: 9:00 ص - 6:00 م'
  );

  const cleanWhatsapp = rawWhatsapp.replace(/[^\d]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    locale === 'ar'
      ? 'مرحباً حاضر، أود التحدث مباشرة بخصوص مشروع حضور رقمي.'
      : 'Hello Hader, I would like to discuss a digital presence project.'
  )}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
          {locale === 'ar' ? 'ابدأ اليوم' : 'Get in Touch'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-typography-primary tracking-tight">
          {locale === 'ar' ? 'دعنا نؤسس حضوراً استثنائياً لمنشأتك' : 'Let’s Build a Premier Presence for Your Venue'}
        </h1>
        <p className="text-base sm:text-lg text-typography-muted leading-relaxed">
          {locale === 'ar'
            ? 'املأ النموذج أدناه أو تواصل معنا عبر واتساب، وسيقوم فريقنا بدراسة احتياجاتك والتواصل معك سريعاً.'
            : 'Fill out the form below or chat on WhatsApp. Our team will review your needs and reach out promptly.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-border-subtle bg-surface-panel p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-typography-primary">
              {locale === 'ar' ? 'بيانات التواصل الرسمية' : 'Official Contact Information'}
            </h2>

            <div className="space-y-6 text-sm text-typography-muted">
              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated text-brand-accent shadow-sm border border-border-subtle">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-typography-primary text-xs uppercase tracking-wider">
                    {locale === 'ar' ? 'المقر' : 'Location'}
                  </div>
                  <div className="mt-1 text-sm font-medium">{address}</div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated text-brand-accent shadow-sm border border-border-subtle">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-typography-primary text-xs uppercase tracking-wider">
                    {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </div>
                  <div className="mt-1 text-sm">
                    <a href={`mailto:${email}`} className="text-brand-accent hover:underline font-mono">
                      {email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated text-brand-accent shadow-sm border border-border-subtle">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-typography-primary text-xs uppercase tracking-wider">
                    {locale === 'ar' ? 'الهاتف' : 'Phone'}
                  </div>
                  <div className="mt-1 text-sm font-mono dir-ltr text-end">{rawPhone}</div>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated text-brand-accent shadow-sm border border-border-subtle">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-typography-primary text-xs uppercase tracking-wider">
                    {locale === 'ar' ? 'أوقات العمل' : 'Working Hours'}
                  </div>
                  <div className="mt-1 text-sm">{workingHours}</div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Box */}
            <div className="pt-4 border-t border-border-subtle">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white px-5 py-3.5 text-sm font-bold shadow-md hover:opacity-95 transition-opacity"
              >
                <MessageCircle className="h-5 w-5" />
                <span>{locale === 'ar' ? 'محادثة مباشرة عبر واتساب' : 'Direct WhatsApp Chat'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form with Full Submission Pipeline */}
        <div className="lg:col-span-7">
          <ContactForm
            locale={locale}
            services={services}
            defaultService={searchParams.service}
            defaultPackage={searchParams.package}
          />
        </div>
      </div>
    </div>
  );
}
