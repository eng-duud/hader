'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FolderTree,
  Layers,
  Package,
  HelpCircle,
  ListOrdered,
  FileText,
  Mail,
  Image as ImageIcon,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { Profile } from '@/lib/data/types';

interface AdminSidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  profile,
  isOpen,
  onClose,
  lang,
}) => {
  const pathname = usePathname();

  const isOwner = profile.role === 'owner';

  const menuItems = [
    {
      href: '/admin',
      labelAr: 'لوحة التحكم',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/clients',
      labelAr: 'العملاء والأعمال',
      labelEn: 'Clients & Work',
      icon: Briefcase,
    },
    {
      href: '/admin/categories',
      labelAr: 'تصنيفات العملاء',
      labelEn: 'Client Categories',
      icon: FolderTree,
    },
    {
      href: '/admin/services',
      labelAr: 'الخدمات الأساسية',
      labelEn: 'Services',
      icon: Layers,
    },
    {
      href: '/admin/packages',
      labelAr: 'الباقات والأسعار',
      labelEn: 'Packages',
      icon: Package,
    },
    {
      href: '/admin/faqs',
      labelAr: 'الأسئلة الشائعة',
      labelEn: 'FAQs',
      icon: HelpCircle,
    },
    {
      href: '/admin/process',
      labelAr: 'خطوات العمل',
      labelEn: 'Process Steps',
      icon: ListOrdered,
    },
    {
      href: '/admin/content',
      labelAr: 'النصوص والصفحات',
      labelEn: 'Content & Pages',
      icon: FileText,
    },
    {
      href: '/admin/leads',
      labelAr: 'طلبات العملاء (Leads)',
      labelEn: 'Leads & Inquiries',
      icon: Mail,
    },
    {
      href: '/admin/media',
      labelAr: 'مكتبة الوسائط',
      labelEn: 'Media Library',
      icon: ImageIcon,
    },
  ];

  // Owner-only sections
  const ownerItems = [
    {
      href: '/admin/settings',
      labelAr: 'إعدادات المنصة',
      labelEn: 'Platform Settings',
      icon: Settings,
    },
    {
      href: '/admin/users',
      labelAr: 'المستخدمون والصلاحيات',
      labelEn: 'Users & Roles',
      icon: Users,
    },
  ];

  const renderLink = (item: typeof menuItems[0]) => {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);

    const Icon = item.icon;
    const label = lang === 'ar' ? item.labelAr : item.labelEn;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-primary text-brand-primary-foreground font-semibold shadow-sm'
            : 'text-typography-muted hover:bg-surface-sunken hover:text-typography-primary'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Surface */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-border-subtle bg-surface-elevated transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border-subtle px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-brand-primary">حاضر</span>
            <span className="rounded-md bg-brand-accent/20 px-2 py-0.5 text-xs font-semibold text-brand-accent">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-typography-muted hover:text-typography-primary p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-typography-muted">
              {lang === 'ar' ? 'إدارة المحتوى' : 'Content Management'}
            </div>
            {menuItems.map(renderLink)}
          </div>

          {isOwner && (
            <div className="space-y-1 border-t border-border-subtle pt-4">
              <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-typography-muted">
                {lang === 'ar' ? 'إدارة النظام (المالك)' : 'Administration (Owner)'}
              </div>
              {ownerItems.map(renderLink)}
            </div>
          )}
        </div>

        {/* User Badge Footer */}
        <div className="border-t border-border-subtle p-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-sunken p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-xs font-bold text-brand-primary-foreground uppercase">
              {profile.role === 'owner' ? 'OW' : 'ED'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-typography-primary">
                {profile.full_name || (profile.role === 'owner' ? 'المالك / Founder' : 'محرر')}
              </p>
              <p className="text-[11px] font-semibold text-brand-accent capitalize">
                {profile.role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
