import React from 'react';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { getCurrentProfile } from '@/lib/auth/session';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import '@/app/globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'لوحة التحكم | Hader Admin',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getCurrentProfile();

  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-surface-base font-sans text-typography-primary antialiased selection:bg-brand-accent selection:text-surface-canvas">
        {!auth ? (
          <div className="min-h-screen bg-surface-base">{children}</div>
        ) : (
          <AdminLayoutClient user={auth.user} profile={auth.profile}>
            {children}
          </AdminLayoutClient>
        )}
      </body>
    </html>
  );
}
