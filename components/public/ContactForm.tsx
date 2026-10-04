'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Service } from '@/lib/data/types';
import { getLocalizedText } from '@/lib/utils/content-helper';
import { submitContactAction, SubmitContactResult } from '@/app/[locale]/(site)/contact/actions';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  RotateCcw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface ContactFormProps {
  locale?: 'ar' | 'en';
  services: Service[];
  defaultService?: string;
  defaultPackage?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  locale = 'ar',
  services,
  defaultService,
  defaultPackage,
}) => {
  const isAr = locale === 'ar';

  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);
  const [sourcePage, setSourcePage] = useState<string>('/contact');
  const [isPending, startTransition] = useTransition();

  const [result, setResult] = useState<SubmitContactResult | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
    if (defaultService) return [defaultService];
    return [];
  });

  // Track client mount time for minimum time-to-submit verification
  useEffect(() => {
    setFormLoadedAt(Date.now());
    if (typeof window !== 'undefined') {
      setSourcePage(window.location.pathname + window.location.search);
    }
  }, []);

  const handleInterestToggle = (slug: string) => {
    setSelectedInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    // Ensure loaded time and source page are attached
    formData.set('form_loaded_at', String(formLoadedAt || Date.now()));
    formData.set('source_page', sourcePage);
    formData.set('locale', locale);

    // Attach all selected interests
    formData.delete('interests');
    selectedInterests.forEach((slug) => formData.append('interests', slug));

    startTransition(async () => {
      const response = await submitContactAction(null, formData);
      setResult(response);
    });
  };

  const handleReset = () => {
    setResult(null);
    setFormLoadedAt(Date.now());
    setSelectedInterests(defaultService ? [defaultService] : []);
  };

  // --------------------------------------------------------------------------
  // SUCCESS STATE VIEW
  // --------------------------------------------------------------------------
  if (result?.success) {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-surface-panel p-8 sm:p-12 text-center shadow-lg animate-fade-in space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-typography-primary">
            {isAr ? 'تم استلام طلبك بنجاح!' : 'Proposal Request Received!'}
          </h2>
          <p className="text-sm sm:text-base text-typography-muted leading-relaxed">
            {result.message}
          </p>
        </div>

        {/* WhatsApp Follow-up CTA */}
        {result.whatsappUrl && (
          <div className="pt-2 max-w-md mx-auto space-y-3">
            <a
              href={result.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-lg hover:opacity-95 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{isAr ? 'متابعة فورية عبر واتساب' : 'Instant WhatsApp Follow-up'}</span>
            </a>
            <p className="text-[11px] text-typography-muted">
              {isAr
                ? 'يمكنك التحدث مباشرة مع استشاري الحلول لتسريع مراجعة وتجهيز عرضك.'
                : 'Chat directly with our solutions consultant to expedite your proposal.'}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border-subtle/60">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-typography-secondary hover:text-brand-accent transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isAr ? 'إرسال طلب آخر' : 'Submit another inquiry'}</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FORM ENTRY VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="rounded-3xl border border-border-subtle bg-surface-panel p-8 sm:p-10 shadow-sm">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-typography-primary">
          {isAr ? 'طلب عرض أسعار أو استشارة' : 'Request Proposal or Consultation'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-typography-muted">
          {isAr
            ? 'يرجى تزويدنا ببياناتك وسيقوم استشاري الحلول بالرد عليك خلال ساعات العمل.'
            : 'Please provide your details and our team will get back to you promptly.'}
        </p>
      </div>

      {result?.error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-500 animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{result.error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hidden Honeypot Field for Spam Defense */}
        <input
          type="text"
          name="hp_field"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none', position: 'absolute', opacity: 0 }}
          aria-hidden="true"
        />

        {/* Row 1: Name and Business Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold text-typography-secondary mb-1.5">
              {isAr ? 'الاسم الكامل *' : 'Full Name *'}
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              required
              aria-required="true"
              aria-invalid={!!result?.fieldErrors?.name}
              aria-describedby={result?.fieldErrors?.name ? 'name-error' : undefined}
              placeholder={isAr ? 'مثال: محمد العمري' : 'e.g. John Doe'}
              className={`w-full text-sm rounded-xl border bg-surface-elevated px-4 py-3 text-typography-primary focus:outline-none focus:ring-1 ${
                result?.fieldErrors?.name
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-border-subtle focus:border-brand-accent focus:ring-brand-accent'
              }`}
            />
            {result?.fieldErrors?.name && (
              <p id="name-error" role="alert" className="mt-1 text-[11px] text-rose-500 font-medium">
                {result.fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-business-name" className="block text-xs font-semibold text-typography-secondary mb-1.5">
              {isAr ? 'اسم المنشأة أو المشروع *' : 'Business Name *'}
            </label>
            <input
              id="contact-business-name"
              type="text"
              name="business_name"
              required
              aria-required="true"
              aria-invalid={!!result?.fieldErrors?.business_name}
              aria-describedby={result?.fieldErrors?.business_name ? 'business-name-error' : undefined}
              placeholder={isAr ? 'مثال: فندق أو مطعم الراقي' : 'e.g. Al-Raqi Hotel'}
              className={`w-full text-sm rounded-xl border bg-surface-elevated px-4 py-3 text-typography-primary focus:outline-none focus:ring-1 ${
                result?.fieldErrors?.business_name
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-border-subtle focus:border-brand-accent focus:ring-brand-accent'
              }`}
            />
            {result?.fieldErrors?.business_name && (
              <p id="business-name-error" role="alert" className="mt-1 text-[11px] text-rose-500 font-medium">
                {result.fieldErrors.business_name}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Phone and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-phone" className="block text-xs font-semibold text-typography-secondary mb-1.5">
              {isAr ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}
            </label>
            <input
              id="contact-phone"
              type="tel"
              name="phone"
              required
              aria-required="true"
              aria-invalid={!!result?.fieldErrors?.phone}
              aria-describedby={result?.fieldErrors?.phone ? 'phone-error' : undefined}
              dir="ltr"
              placeholder="+967 770 000 000"
              className={`w-full text-sm font-mono rounded-xl border bg-surface-elevated px-4 py-3 text-typography-primary text-start focus:outline-none focus:ring-1 ${
                result?.fieldErrors?.phone
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-border-subtle focus:border-brand-accent focus:ring-brand-accent'
              }`}
            />
            {result?.fieldErrors?.phone && (
              <p id="phone-error" role="alert" className="mt-1 text-[11px] text-rose-500 font-medium">
                {result.fieldErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold text-typography-secondary mb-1.5">
              {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              aria-invalid={!!result?.fieldErrors?.email}
              aria-describedby={result?.fieldErrors?.email ? 'email-error' : undefined}
              placeholder="contact@business.ye"
              className={`w-full text-sm rounded-xl border bg-surface-elevated px-4 py-3 text-typography-primary focus:outline-none focus:ring-1 ${
                result?.fieldErrors?.email
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-border-subtle focus:border-brand-accent focus:ring-brand-accent'
              }`}
            />
            {result?.fieldErrors?.email && (
              <p id="email-error" role="alert" className="mt-1 text-[11px] text-rose-500 font-medium">
                {result.fieldErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* Interest Checkboxes */}
        <fieldset>
          <legend className="block text-xs font-semibold text-typography-secondary mb-3">
            {isAr ? 'الخدمات المطلوبة' : 'Services of Interest'}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label={isAr ? 'الخدمات المطلوبة' : 'Services of Interest'}>
            {services.map((svc) => {
              const isChecked = selectedInterests.includes(svc.slug);
              const title = getLocalizedText(svc.title_ar, svc.title_en, locale);

              return (
                <button
                  key={svc.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  onClick={() => handleInterestToggle(svc.slug)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold transition-all text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                    isChecked
                      ? 'border-brand-accent bg-brand-accent/10 text-typography-primary shadow-sm ring-1 ring-brand-accent/20'
                      : 'border-border-subtle bg-surface-elevated/40 text-typography-muted hover:bg-surface-elevated'
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isChecked
                        ? 'border-brand-accent bg-brand-accent text-surface-canvas'
                        : 'border-border-subtle bg-surface-panel'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{title}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Message / Details */}
        <div>
          <label htmlFor="contact-message" className="block text-xs font-semibold text-typography-secondary mb-1.5">
            {isAr ? 'تفاصيل الطلب أو طبيعة المنشأة *' : 'Project Details or Requirements *'}
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            aria-required="true"
            aria-invalid={!!result?.fieldErrors?.message}
            aria-describedby={result?.fieldErrors?.message ? 'message-error' : undefined}
            rows={4}
            placeholder={
              isAr
                ? 'اذكر نبذة عن منشأتك والخدمات التي ترغب في تجهيزها...'
                : 'Tell us briefly about your business and expectations...'
            }
            defaultValue={
              defaultPackage
                ? isAr
                  ? `أرغب في الاستفسار عن باقة: ${defaultPackage}`
                  : `Inquiring about package: ${defaultPackage}`
                : ''
            }
            className={`w-full text-sm rounded-xl border bg-surface-elevated px-4 py-3 text-typography-primary leading-relaxed focus:outline-none focus:ring-1 ${
              result?.fieldErrors?.message
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                : 'border-border-subtle focus:border-brand-accent focus:ring-brand-accent'
            }`}
          />
          {result?.fieldErrors?.message && (
            <p id="message-error" role="alert" className="mt-1 text-[11px] text-rose-500 font-medium">
              {result.fieldErrors.message}
            </p>
          )}
        </div>

        {/* Privacy Consent Line */}
        <div className="flex items-start gap-2.5 text-[11px] text-typography-muted leading-relaxed">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand-accent mt-0.5" />
          <span>
            {isAr ? (
              <>
                بإرسال هذا النموذج، فإنك توافق على معالجة بياناتك للتواصل بخصوص طلبك وفق{' '}
                <a href="/ar/privacy" className="text-brand-accent hover:underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-accent rounded">
                  سياسة الخصوصية
                </a>.
              </>
            ) : (
              <>
                By submitting this form, you agree to the processing of your contact details per our{' '}
                <a href="/en/privacy" className="text-brand-accent hover:underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-accent rounded">
                  Privacy Policy
                </a>.
              </>
            )}
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-8 py-4 text-base font-bold text-brand-primary-foreground shadow-lg shadow-brand-primary/20 hover:opacity-95 transition-all disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{isAr ? 'جاري إرسال الطلب...' : 'Sending Proposal Request...'}</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 rtl:rotate-180" />
              <span>{isAr ? 'إرسال طلب العرض' : 'Submit Proposal Request'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
