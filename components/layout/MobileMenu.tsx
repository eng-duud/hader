'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('common');
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navLinks = [
    { href: '/#services', label: t('nav.services') },
    { href: '/clients', label: t('nav.clients') },
    { href: '/#packages', label: t('nav.packages') },
    { href: '/#faq', label: t('nav.faq') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface-elevated p-2 text-typography-primary transition-colors hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 flex flex-col bg-surface-base/95 backdrop-blur-md">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between border-b border-border-subtle py-3 text-lg font-medium text-typography-primary transition-colors hover:text-brand-accent"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-typography-muted transition-transform rtl:rotate-180" />
                </Link>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center justify-between border-t border-border-subtle pt-6">
                <span className="text-sm font-medium text-typography-muted">
                  {t('switchLanguage')}
                </span>
                <LanguageSwitcher />
              </div>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-3 text-center text-sm font-semibold text-brand-primary-foreground shadow-sm transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                {t('cta.requestProposal')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
