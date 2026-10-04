'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, Link } from '@/navigation';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const currentLocale = useLocale();
  const pathname = usePathname();

  const targetLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const label = currentLocale === 'ar' ? 'English' : 'العربية';

  return (
    <Link
      href={pathname}
      locale={targetLocale}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-elevated px-3 py-1.5 text-sm font-medium text-typography-primary transition-colors hover:border-brand-accent hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${className}`}
      aria-label={`Switch to ${label}`}
      title={`Switch to ${label}`}
    >
      <Globe className="h-4 w-4 shrink-0 text-typography-muted" />
      <span>{label}</span>
    </Link>
  );
};
