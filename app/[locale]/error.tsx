'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 shadow-sm border border-rose-500/20">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-typography-primary">
        حدث خطأ غير متوقع
      </h1>

      <p className="mt-2 text-sm text-typography-muted max-w-md">
        نعتذر عن هذا الخلل. تم تسجيل المشكلة وجاري العمل على معالجتها. يرجى إعادة المحاولة أو العودة للصفحة الرئيسية.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-bold text-brand-primary-foreground shadow-sm hover:bg-brand-primary-hover transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>إعادة المحاولة</span>
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-6 py-3 text-sm font-bold text-typography-primary hover:border-brand-accent transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
