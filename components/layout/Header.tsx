'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';

export const Header: React.FC = () => {
  const t = useTranslations('common');

  const navLinks = [
    { href: '/#services', label: t('nav.services') },
    { href: '/clients', label: t('nav.clients') },
    { href: '/#packages', label: t('nav.packages') },
    { href: '/#faq', label: t('nav.faq') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface-base/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <div className="flex items-center">
          <Logo priority />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-typography-muted transition-colors hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions: Language Switcher & Primary CTA */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary-foreground shadow-sm transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            {t('cta.requestProposal')}
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <MobileMenu />
      </div>
    </header>
  );
};
