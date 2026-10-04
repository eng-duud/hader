import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
