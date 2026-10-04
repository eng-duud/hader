'use server';

import { requireRole } from '@/lib/auth/session';
import { updateSiteSettings } from '@/lib/data/settings';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';

export interface SettingsActionResponse {
  success: boolean;
  error?: string;
}

export async function saveSettingsAction(prevState: any, formData: FormData): Promise<SettingsActionResponse> {
  // 1. Strict Server-Side Role Guard: Owner only
  await requireRole(['owner']);

  const socialLinksRaw = formData.get('social_links') as string;
  let socialLinks: Record<string, string> = {};
  try {
    socialLinks = socialLinksRaw ? JSON.parse(socialLinksRaw) : {};
  } catch {
    socialLinks = {};
  }

  const payload = {
    company_name_ar: (formData.get('company_name_ar') as string)?.trim() || '',
    company_name_en: (formData.get('company_name_en') as string)?.trim() || '',
    tagline_ar: (formData.get('tagline_ar') as string)?.trim() || '',
    tagline_en: (formData.get('tagline_en') as string)?.trim() || '',
    phone: (formData.get('phone') as string)?.trim() || '',
    whatsapp: (formData.get('whatsapp') as string)?.trim() || '',
    email: (formData.get('email') as string)?.trim() || '',
    address_ar: (formData.get('address_ar') as string)?.trim() || '',
    address_en: (formData.get('address_en') as string)?.trim() || '',
    working_hours_ar: (formData.get('working_hours_ar') as string)?.trim() || '',
    working_hours_en: (formData.get('working_hours_en') as string)?.trim() || '',
    social_links: socialLinks,
    seo_title_ar: (formData.get('seo_title_ar') as string)?.trim() || null,
    seo_title_en: (formData.get('seo_title_en') as string)?.trim() || null,
    seo_description_ar: (formData.get('seo_description_ar') as string)?.trim() || null,
    seo_description_en: (formData.get('seo_description_en') as string)?.trim() || null,
    og_image_url: (formData.get('og_image_url') as string)?.trim() || null,
    analytics_id: (formData.get('analytics_id') as string)?.trim() || null,
  };

  const result = await updateSiteSettings(payload);

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل تحديث الإعدادات' };
  }

  // 2. On-demand Cache Revalidation
  revalidatePublicPaths();
  revalidatePath('/admin/settings');

  return { success: true };
}
