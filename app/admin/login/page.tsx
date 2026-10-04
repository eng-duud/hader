'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { loginAction } from '@/app/admin/actions';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await loginAction(null, formData);
      if (result && !result.success && result.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: any) {
      // Next.js redirect() throws a NEXT_REDIRECT error which should not be caught as an error
      if (err?.message?.includes('NEXT_REDIRECT')) {
        return;
      }
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-base px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border-subtle bg-surface-elevated p-8 sm:p-10 shadow-xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <Image
              src="/brand/wordmark.svg"
              alt="حاضر - Hader"
              width={180}
              height={45}
              priority
              className="h-10 w-auto object-contain dark:invert"
            />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-typography-primary">
            لوحة الإدارة المركزية
          </h1>
          <p className="mt-2 text-sm text-typography-muted">
            تسجيل الدخول لإدارة محتوى وخدمات المنصة
          </p>
        </div>

        {/* Generic Error Alert */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-status-error/30 bg-status-error/10 p-4 text-sm font-medium text-status-error" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-typography-primary">
              البريد الإلكتروني
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-typography-muted">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="admin-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="admin@hader.ye"
                className="block w-full rounded-lg border border-border-strong bg-surface-sunken ps-10 pe-4 py-2.5 text-sm text-typography-primary placeholder:text-typography-muted/50 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-typography-primary">
              كلمة المرور
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-typography-muted">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="block w-full rounded-lg border border-border-strong bg-surface-sunken ps-10 pe-11 py-2.5 text-sm text-typography-primary placeholder:text-typography-muted/50 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-typography-muted hover:text-typography-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-brand-primary-foreground shadow-sm transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>

        <div className="pt-4 text-center text-xs text-typography-muted">
          منصة حاضر © {new Date().getFullYear()} — نظام محمي ومراقب
        </div>
      </div>
    </div>
  );
}
