import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Logo } from '@/components/brand/Logo';
import { SiteSettings } from '@/lib/data/types';
import { getLocalizedText } from '@/lib/utils/content-helper';
import { Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  settings?: SiteSettings | null;
  locale?: string;
}

export const Footer: React.FC<FooterProps> = ({ settings, locale = 'ar' }) => {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  const phone = settings?.phone || '+967 770 000 000';
  const email = settings?.email || 'contact@hader.ye';
  const address = getLocalizedText(settings?.address_ar, settings?.address_en, locale, 'صنعاء، الجمهورية اليمنية');
  const legalName = getLocalizedText(
    settings?.company_name_ar,
    settings?.company_name_en,
    locale,
    'حاضر لحلول الأعمال الرقمية'
  );

  return (
    <footer className="border-t border-border-subtle bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand & Purpose Column */}
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-typography-muted">
              {t('footer.description')}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-sm text-typography-muted">
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
                <span>{address}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-accent" />
                <a
                  href={`mailto:${email}`}
                  className="transition-colors hover:text-brand-accent font-mono text-xs"
                >
                  {email}
                </a>
              </div>
              <div className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-accent" />
                <span dir="ltr" className="font-mono text-xs">{phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-typography-primary">
              {t('footer.quickLinks')}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/#services"
                  className="text-sm text-typography-muted transition-colors hover:text-brand-accent"
                >
                  {t('common.nav.services')}
                </Link>
              </li>
              <li>
                <Link
                  href="/clients"
                  className="text-sm text-typography-muted transition-colors hover:text-brand-accent"
                >
                  {t('common.nav.clients')}
                </Link>
              </li>
              <li>
                <Link
                  href="/#packages"
                  className="text-sm text-typography-muted transition-colors hover:text-brand-accent"
                >
                  {t('common.nav.packages')}
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-sm text-typography-muted transition-colors hover:text-brand-accent"
                >
                  {t('common.nav.faq')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-typography-muted transition-colors hover:text-brand-accent"
                >
                  {t('common.nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-typography-primary">
              {t('footer.legalLinks')}
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-typography-muted transition-colors hover:text-brand-accent"
                >
                  {t('legal.privacyTitle')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-typography-muted transition-colors hover:text-brand-accent"
                >
                  {t('legal.termsTitle')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border-subtle pt-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-typography-muted">
            © {currentYear} {legalName}. {t('footer.rightsReserved')}
          </p>
          <p className="mt-4 text-xs text-typography-muted sm:mt-0">
            {t('common.tagline')}
          </p>
        </div>
      </div>
    </footer>
  );
};
