'use server';

import { createClient } from '@/lib/supabase/server';
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginAttempts } from '@/lib/auth/rate-limiter';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function loginAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const email = (formData.get('email') as string)?.trim()?.toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' };
  }

  // Derive client IP for rate limiting
  const headersList = headers();
  const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
  const throttleKey = `${clientIp}:${email}`;

  // 1. Rate Limiting Check
  const rateLimit = checkLoginRateLimit(throttleKey);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد ${rateLimit.retryAfterSeconds} ثانية.`,
    };
  }

  // 2. Supabase Auth
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      recordFailedLoginAttempt(throttleKey);
      // Strictly generic message: never reveal whether the user exists or password was wrong
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // 3. Verify user has a profile with owner or editor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (!profile || !['owner', 'editor'].includes(profile.role)) {
      await supabase.auth.signOut();
      return { success: false, error: 'هذا الحساب غير مصرح له بالوصول إلى لوحة الإدارة' };
    }

    resetLoginAttempts(throttleKey);
  } catch (err: any) {
    return { success: false, error: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' };
  }

  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
