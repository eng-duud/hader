'use server';

import { headers } from 'next/headers';
import { leadSchema } from '@/lib/validation';
import { submitLead } from '@/lib/data/leads';
import { getSiteSettings } from '@/lib/data/settings';
import { dispatchLeadNotification } from '@/lib/email';
import {
  isHoneypotTriggered,
  isSubmittedTooFast,
  checkIpRateLimit,
  verifyTurnstileToken,
} from '@/lib/security/spam-protection';

export interface SubmitContactResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  leadId?: string;
  whatsappUrl?: string;
}

export async function submitContactAction(
  prevState: any,
  formData: FormData
): Promise<SubmitContactResult> {
  const reqHeaders = headers();
  const rawIp =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    reqHeaders.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || '';

  // Extract raw form fields
  const name = (formData.get('name') as string)?.trim() || '';
  const business_name = (formData.get('business_name') as string)?.trim() || '';
  const phone = (formData.get('phone') as string)?.trim() || '';
  const email = (formData.get('email') as string)?.trim() || '';
  const message = (formData.get('message') as string)?.trim() || '';
  const locale = ((formData.get('locale') as string) || 'ar') as 'ar' | 'en';
  const source_page = (formData.get('source_page') as string) || '/contact';

  // Honeypot & Timestamp
  const honeypot = (formData.get('hp_field') as string) || '';
  const loadedAt = parseInt(formData.get('form_loaded_at') as string, 10);
  const turnstileToken = (formData.get('cf-turnstile-response') as string) || '';

  // Multiple checkboxes for interests
  const interests = formData.getAll('interests').map((v) => String(v));

  const isAr = locale === 'ar';

  // 1. Honeypot check (Silent rejection: return success to avoid bot adaptation)
  if (isHoneypotTriggered(honeypot)) {
    console.warn(`[Spam Blocked] Honeypot triggered from IP: ${rawIp}`);
    return {
      success: true,
      message: isAr
        ? 'شكراً لك، تم استلام طلبك بنجاح وسنتواصل معك قريباً.'
        : 'Thank you, your request has been received successfully.',
    };
  }

  // 2. Minimum time-to-submit check (Silent rejection for automated scripts)
  if (isSubmittedTooFast(loadedAt)) {
    console.warn(`[Spam Blocked] Form submitted too quickly (${Date.now() - loadedAt}ms) from IP: ${rawIp}`);
    return {
      success: true,
      message: isAr
        ? 'شكراً لك، تم استلام طلبك بنجاح وسنتواصل معك قريباً.'
        : 'Thank you, your request has been received successfully.',
    };
  }

  // 3. IP Rate Limiting (5 requests per hour)
  const rateLimit = checkIpRateLimit(rawIp);
  if (!rateLimit.allowed) {
    console.warn(`[Rate Limit Exceeded] IP: ${rawIp} exceeded 5 submissions per hour`);
    return {
      success: false,
      error: isAr
        ? 'تجاوزت الحد المسموح من الطلبات لهذا الوقت. يرجى المحاولة لاحقاً بعد ساعة.'
        : 'Too many requests from your IP. Please try again in an hour.',
    };
  }

  // 4. Cloudflare Turnstile Verification (Optional / Env-gated)
  const turnstileResult = await verifyTurnstileToken(turnstileToken, rawIp);
  if (!turnstileResult.success) {
    return {
      success: false,
      error: isAr
        ? 'فشل التحقق الأمني التلقائي. يرجى إعادة المحاولة.'
        : 'Security verification failed. Please try again.',
    };
  }

  // 5. Zod Validation
  const validated = leadSchema.safeParse({
    name,
    business_name,
    phone,
    email: email || undefined,
    interests,
    message,
    locale,
    source_page,
    user_agent: userAgent,
    honeypot,
    timestamp: loadedAt,
  });

  if (!validated.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validated.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    }
    return {
      success: false,
      error: isAr ? 'يرجى تصحيح الأخطاء الموضحة في النموذج.' : 'Please correct the errors in the form.',
      fieldErrors,
    };
  }

  try {
    // 6. Save Lead First via Server Service Role
    const { data: lead, error: dbError } = await submitLead(validated.data, rawIp);

    if (dbError || !lead) {
      console.error('[Database Error saving lead]:', dbError);
      return {
        success: false,
        error: isAr
          ? 'تعذر حفظ طلبك حالياً بسبب خطأ غير متوقع. يرجى المحاولة لاحقاً أو مراسلتنا عبر واتساب.'
          : 'Unable to process your request at this time. Please try again or reach out on WhatsApp.',
      };
    }

    // 7. Email Owner Second (Failure to send must NOT lose the lead)
    const settings = await getSiteSettings();
    dispatchLeadNotification(lead, settings?.email).catch((emailErr) => {
      console.error('[Background Email Dispatch Failed]:', emailErr);
    });

    // 8. Generate WhatsApp follow-up link
    const targetPhone = settings?.whatsapp || settings?.phone || '+967 770 000 000';
    const cleanPhone = targetPhone.replace(/[^\d]/g, '');
    const followUpText = isAr
      ? `مرحباً حاضر، لقد أرسلت طلباً عبر الموقع باسم ${lead.name} (${lead.business_name}) وأود المتابعة معكم.`
      : `Hello Hader, I just submitted an inquiry on the website under ${lead.name} (${lead.business_name}) and would like to follow up.`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(followUpText)}`;

    return {
      success: true,
      leadId: lead.id,
      whatsappUrl,
      message: isAr
        ? 'شكراً لك، تم استلام طلبك بنجاح وسيقوم فريقنا بالتواصل معك في أقرب وقت.'
        : 'Thank you, your proposal request has been received. Our team will contact you shortly.',
    };
  } catch (err: any) {
    console.error('[Unhandled Contact Submission Error]:', err.message || err);
    return {
      success: false,
      error: isAr
        ? 'حدث خطأ غير متوقع. يرجى مراسلتنا مباشرة عبر واتساب.'
        : 'An unexpected error occurred. Please contact us directly via WhatsApp.',
    };
  }
}
