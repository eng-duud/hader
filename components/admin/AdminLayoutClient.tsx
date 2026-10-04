'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/lib/data/types';
import { User } from '@supabase/supabase-js';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ToastProvider } from './Toast';

interface AdminLayoutClientProps {
  user: User;
  profile: Profile;
  children: React.ReactNode;
}

export const AdminLayoutClient: React.FC<AdminLayoutClientProps> = ({
  user,
  profile,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminLang, setAdminLang] = useState<'ar' | 'en'>('ar');

  // Persist admin language preference in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hader_admin_lang');
    if (saved === 'ar' || saved === 'en') {
      setAdminLang(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const next = adminLang === 'ar' ? 'en' : 'ar';
    setAdminLang(next);
    localStorage.setItem('hader_admin_lang', next);
  };

  return (
    <ToastProvider>
      <div
        className="flex min-h-screen bg-surface-base font-sans text-typography-primary"
        dir={adminLang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Sidebar */}
        <AdminSidebar
          profile={profile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          lang={adminLang}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader
            onMenuToggle={() => setSidebarOpen(true)}
            lang={adminLang}
            onLangToggle={toggleLanguage}
            userEmail={user.email}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
