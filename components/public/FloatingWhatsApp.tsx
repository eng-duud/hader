'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingWhatsAppProps {
  phone?: string | null;
  locale?: string;
  defaultMessage?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phone,
  locale = 'ar',
  defaultMessage,
}) => {
  if (!phone || !phone.trim()) {
    return null;
  }

  // Sanitize phone number for wa.me (digits only)
  const cleanPhone = phone.replace(/[^\d]/g, '');
  if (!cleanPhone) {
    return null;
  }

  const messageText =
    defaultMessage ||
    (locale === 'ar'
      ? 'مرحباً، أود الاستفسار عن خدمات حاضر لتجهيز الحضور الرقمي لمنشأتي.'
      : 'Hello, I would like to inquire about Hader services for my business.');

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  const ariaLabel = locale === 'ar' ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp';

  return (
    <aside
      aria-label={ariaLabel}
      className="fixed bottom-6 end-6 z-50 group flex items-center"
    >
      {/* Tooltip on hover */}
      <span className="hidden sm:inline-block me-3 px-3 py-1.5 text-xs font-bold text-typography-primary bg-surface-panel/90 backdrop-blur-md rounded-xl border border-border-subtle shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {locale === 'ar' ? 'تحدث مباشرة مع فريقنا' : 'Chat directly with our team'}
      </span>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
      >
        {/* Subtle ping indicator */}
        <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-surface-canvas" />
        </span>

        <MessageCircle className="h-7 w-7" />
      </a>
    </aside>
  );
};
