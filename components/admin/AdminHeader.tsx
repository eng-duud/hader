'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Globe, ExternalLink, LogOut } from 'lucide-react';
import { logoutAction } from '@/app/admin/actions';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  lang: 'ar' | 'en';
  onLangToggle: () => void;
  userEmail?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMenuToggle,
  lang,
  onLangToggle,
  userEmail,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-surface-elevated/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden rounded-lg border border-border-subtle p-2 text-typography-muted hover:text-typography-primary"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right Top Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Public Site Link */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-typography-muted transition-colors hover:border-brand-accent hover:text-typography-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? 'معاينة الموقع العام' : 'View Public Site'}</span>
        </Link>

        {/* Language Toggle */}
        <button
          type="button"
          onClick={onLangToggle}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-typography-primary transition-colors hover:border-brand-accent"
          title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
        >
          <Globe className="h-3.5 w-3.5 text-brand-accent" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        {/* Logout Button */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-status-error/30 bg-status-error/5 px-3 py-1.5 text-xs font-semibold text-status-error transition-colors hover:bg-status-error hover:text-white"
            title={lang === 'ar' ? 'تسجيل الخروج' : 'Log out'}
          >
            <LogOut className="h-3.5 w-3.5 rtl:rotate-180" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'خروج' : 'Logout'}</span>
          </button>
        </form>
      </div>
    </header>
  );
};
