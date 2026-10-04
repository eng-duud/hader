import { z } from 'zod';

// HTTPS-only URL regex
export const httpsUrlRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;

// 1. Site Settings Schema
export const siteSettingsSchema = z.object({
  company_name_ar: z.string().min(2, 'اسم الشركة بالعربية مطلوب'),
  company_name_en: z.string().min(2, 'Company name in English is required'),
  tagline_ar: z.string().min(5, 'الشعار اللفظي بالعربية مطلوب'),
  tagline_en: z.string().min(5, 'Tagline in English is required'),
  phone: z.string().min(7, 'رقم الهاتف مطلوب'),
  whatsapp: z.string().min(7, 'رقم الواتساب مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  address_ar: z.string().min(3, 'العنوان بالعربية مطلوب'),
  address_en: z.string().min(3, 'Address in English is required'),
  working_hours_ar: z.string().min(3, 'ساعات العمل بالعربية مطلوبة'),
  working_hours_en: z.string().min(3, 'Working hours in English are required'),
  social_links: z.record(z.string()).default({}),
  seo_title_ar: z.string().optional().nullable(),
  seo_title_en: z.string().optional().nullable(),
  seo_description_ar: z.string().optional().nullable(),
  seo_description_en: z.string().optional().nullable(),
  og_image_url: z.string().url().optional().nullable(),
  analytics_id: z.string().optional().nullable(),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

// 2. Content Block Schema
export const contentBlockSchema = z.object({
  key: z.string().min(2, 'مفتاح المحتوى مطلوب').regex(/^[a-z0-9_.-]+$/, 'Key must be alphanumeric with underscores/hyphens'),
  value_ar: z.string(),
  value_en: z.string(),
  type: z.enum(['text', 'markdown', 'html']).default('text'),
});

export type ContentBlockInput = z.infer<typeof contentBlockSchema>;

// 3. Service Schema
export const serviceSchema = z
  .object({
    slug: z.string().min(2, 'المعرف اللطيف مطلوب').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    title_ar: z.string().default(''),
    title_en: z.string().default(''),
    description_ar: z.string().default(''),
    description_en: z.string().default(''),
    icon: z.string().default('Globe'),
    sort_order: z.number().int().default(0),
    is_visible: z.boolean().default(true),
  })
  .refine((data) => (data.title_ar?.trim().length > 0 || data.title_en?.trim().length > 0), {
    message: 'يجب إدخال عنوان الخدمة بلغة واحدة على الأقل',
    path: ['title_ar'],
  })
  .refine((data) => (data.description_ar?.trim().length > 0 || data.description_en?.trim().length > 0), {
    message: 'يجب إدخال وصف الخدمة بلغة واحدة على الأقل',
    path: ['description_ar'],
  });

export type ServiceInput = z.infer<typeof serviceSchema>;

// 4. Package Schema
export const packageSchema = z
  .object({
    slug: z.string().min(2, 'المعرف اللطيف مطلوب').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    name_ar: z.string().default(''),
    name_en: z.string().default(''),
    description_ar: z.string().default(''),
    description_en: z.string().default(''),
    features_ar: z.array(z.string()).default([]),
    features_en: z.array(z.string()).default([]),
    price_cents: z.number().int().nonnegative().optional().nullable(),
    currency: z.string().default('YER'),
    is_highlighted: z.boolean().default(false),
    is_visible: z.boolean().default(true),
    sort_order: z.number().int().default(0),
  })
  .refine((data) => (data.name_ar?.trim().length > 0 || data.name_en?.trim().length > 0), {
    message: 'يجب إدخال اسم الباقة بلغة واحدة على الأقل',
    path: ['name_ar'],
  })
  .refine((data) => (data.description_ar?.trim().length > 0 || data.description_en?.trim().length > 0), {
    message: 'يجب إدخال وصف الباقة بلغة واحدة على الأقل',
    path: ['description_ar'],
  });

export type PackageInput = z.infer<typeof packageSchema>;

// 5. FAQ Schema
export const faqSchema = z
  .object({
    question_ar: z.string().default(''),
    question_en: z.string().default(''),
    answer_ar: z.string().default(''),
    answer_en: z.string().default(''),
    sort_order: z.number().int().default(0),
    is_visible: z.boolean().default(true),
  })
  .refine((data) => (data.question_ar?.trim().length > 0 || data.question_en?.trim().length > 0), {
    message: 'يجب إدخال نص السؤال بلغة واحدة على الأقل',
    path: ['question_ar'],
  })
  .refine((data) => (data.answer_ar?.trim().length > 0 || data.answer_en?.trim().length > 0), {
    message: 'يجب إدخال نص الإجابة بلغة واحدة على الأقل',
    path: ['answer_ar'],
  });

export type FaqInput = z.infer<typeof faqSchema>;

// 6. Process Step Schema
export const processStepSchema = z
  .object({
    step_number: z.number().int().positive('رقم الخطوة يجب أن يكون موجباً'),
    title_ar: z.string().default(''),
    title_en: z.string().default(''),
    description_ar: z.string().default(''),
    description_en: z.string().default(''),
    sort_order: z.number().int().default(0),
    is_visible: z.boolean().default(true),
  })
  .refine((data) => (data.title_ar?.trim().length > 0 || data.title_en?.trim().length > 0), {
    message: 'يجب إدخال عنوان الخطوة بلغة واحدة على الأقل',
    path: ['title_ar'],
  })
  .refine((data) => (data.description_ar?.trim().length > 0 || data.description_en?.trim().length > 0), {
    message: 'يجب إدخال وصف الخطوة بلغة واحدة على الأقل',
    path: ['description_ar'],
  });

export type ProcessStepInput = z.infer<typeof processStepSchema>;

// 7. Client Category Schema
export const clientCategorySchema = z
  .object({
    slug: z.string().min(2, 'المعرف اللطيف مطلوب').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    name_ar: z.string().default(''),
    name_en: z.string().default(''),
    sort_order: z.number().int().default(0),
  })
  .refine((data) => (data.name_ar?.trim().length > 0 || data.name_en?.trim().length > 0), {
    message: 'يجب إدخال اسم التصنيف بلغة واحدة على الأقل',
    path: ['name_ar'],
  });

export type ClientCategoryInput = z.infer<typeof clientCategorySchema>;

// 8. Client Schema (Section 5.3)
export const clientSchema = z
  .object({
    name_ar: z.string().default(''),
    name_en: z.string().default(''),
    slug: z.string().min(2, 'المعرف اللطيف مطلوب').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description_ar: z.string().max(280, 'الوصف بالعربية يجب ألا يتجاوز 280 حرفاً').default(''),
    description_en: z.string().max(280, 'Description in English must not exceed 280 characters').default(''),
    website_url: z
      .string()
      .min(1, 'رابط الموقع مطلوب')
      .refine(
        (url) => {
          const lower = url.trim().toLowerCase();
          return (
            !lower.startsWith('javascript:') &&
            !lower.startsWith('data:') &&
            !lower.startsWith('http://') &&
            lower.startsWith('https://')
          );
        },
        { message: 'يجب أن يبدأ الرابط بـ https:// حصراً (بروتوكول آمن)' }
      )
      .refine(
        (url) => {
          try {
            const parsed = new URL(url.trim());
            return parsed.protocol === 'https:' && parsed.hostname.includes('.');
          } catch {
            return false;
          }
        },
        { message: 'صيغة الرابط غير صحيحة أو غير مكتملة' }
      ),
    logo: z.string().min(1, 'شعار العميل مطلوب'),
    cover_image: z.string().optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    is_featured: z.boolean().default(false),
    is_published: z.boolean().default(false),
    sort_order: z.number().int().default(0),
  })
  .refine((data) => (data.name_ar?.trim().length > 0 || data.name_en?.trim().length > 0), {
    message: 'يجب إدخال اسم العميل بلغة واحدة على الأقل',
    path: ['name_ar'],
  })
  .refine((data) => (data.description_ar?.trim().length > 0 || data.description_en?.trim().length > 0), {
    message: 'يجب إدخال وصف العميل بلغة واحدة على الأقل',
    path: ['description_ar'],
  });

export type ClientInput = z.infer<typeof clientSchema>;

// 9. Lead Schema (Section 7)
export const leadSchema = z.object({
  name: z.string().min(2, 'الاسم الكامل مطلوب'),
  business_name: z.string().min(2, 'اسم المنشأة مطلوب'),
  phone: z.string().min(7, 'رقم الهاتف مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  interests: z.array(z.string()).default([]),
  message: z.string().min(5, 'تفاصيل الرسالة مطلوبة').max(2000, 'الرسالة طويلة جداً'),
  locale: z.enum(['ar', 'en']).default('ar'),
  source_page: z.string().default('/'),
  user_agent: z.string().optional(),
  honeypot: z.string().max(0, 'Spam detected').optional(), // Must be empty
  timestamp: z.number().optional(), // For time-to-submit verification
});

export type LeadInput = z.infer<typeof leadSchema>;

// 10. Media Record Schema
export const mediaSchema = z.object({
  storage_path: z.string().min(1),
  public_url: z.string().url(),
  alt_ar: z.string().default(''),
  alt_en: z.string().default(''),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  mime_type: z.string().refine(
    (mime) => ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(mime),
    'نوع الملف غير مسموح به'
  ),
  size_bytes: z.number().int().max(5242880, 'حجم الملف يجب ألا يتجاوز 5 ميجابايت'),
});

export type MediaInput = z.infer<typeof mediaSchema>;

// 11. Profile Schema
export const profileSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'editor']),
  full_name: z.string().optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
