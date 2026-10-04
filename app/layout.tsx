import React from 'react';

/**
 * Root Layout for Next.js App Router with next-intl.
 * The localized <html> and <body> tags are defined in app/[locale]/layout.tsx
 * and app/admin/layout.tsx to support dynamic lang, dir, and typography.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
