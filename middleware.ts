import { NextRequest, NextResponse } from 'next/server';
import createNextIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const intlMiddleware = createNextIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle Admin Routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Enforce noindex on all admin pages
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

    // Create Supabase SSR Client for middleware token refresh
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    // Fetch authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // A. If accessing /admin/login
    if (pathname === '/admin/login') {
      if (user) {
        // Already authenticated, redirect to /admin
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return response;
    }

    // B. If accessing protected /admin route without user
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // C. Check role for owner-only sections: /admin/users and /admin/settings
    if (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/settings')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.role !== 'owner') {
        // Forbidden: Redirect editor to admin dashboard with forbidden flag
        const forbiddenUrl = new URL('/admin', request.url);
        forbiddenUrl.searchParams.set('error', 'forbidden');
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    return response;
  }

  // 2. Public Site Routes: delegate to next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/(ar|en)/:path*',
    '/((?!api|_next|_vercel|brand|favicon\\.ico|.*\\..*).*)',
  ],
};
