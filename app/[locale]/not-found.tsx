import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-sunken text-brand-accent">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-typography-primary sm:text-4xl">
        {t('notFoundTitle')}
      </h1>
      <p className="mt-3 max-w-md text-sm text-typography-muted">
        {t('notFoundDescription')}
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-brand-primary-foreground shadow-sm transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <span>{t('backHome')}</span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
