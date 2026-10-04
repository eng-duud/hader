import React from 'react';
import type { Metadata } from 'next';
import { getCurrentProfile } from '@/lib/auth/session';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import '@/app/globals.css';

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
  const headersList = headers();
  const pathname = headersList.get('x-invoke-path') || '';

  // If rendering the login page, render children directly without the sidebar shell
  const auth = await getCurrentProfile();

  if (!auth) {
    // If not authenticated, the login page is shown, or middleware will redirect
    return <div className="min-h-screen bg-surface-base">{children}</div>;
  }

  return (
    <AdminLayoutClient user={auth.user} profile={auth.profile}>
      {children}
    </AdminLayoutClient>
  );
}
