'use server';

import { requireRole } from '@/lib/auth/session';
import {
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  deleteMultipleClients,
  reorderClients,
  getAllClients,
} from '@/lib/data/clients';
import { validateAndNormalizeUrl, generateClientSlug } from '@/lib/utils/client-helpers';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ClientActionResponse {
  success: boolean;
  error?: string;
  count?: number;
}

export async function saveClientAction(prevState: any, formData: FormData): Promise<ClientActionResponse> {
  await requireRole(['owner', 'editor']);

  const id = (formData.get('id') as string)?.trim();
  const name_ar = (formData.get('name_ar') as string)?.trim() || '';
  const name_en = (formData.get('name_en') as string)?.trim() || '';
  let slug = (formData.get('slug') as string)?.trim()?.toLowerCase() || '';
  const description_ar = (formData.get('description_ar') as string)?.trim() || '';
  const description_en = (formData.get('description_en') as string)?.trim() || '';
  const raw_website_url = (formData.get('website_url') as string)?.trim() || '';
  const logo = (formData.get('logo') as string)?.trim() || '';
  const cover_image = (formData.get('cover_image') as string)?.trim() || null;
  const category_id = (formData.get('category_id') as string)?.trim() || null;
  const is_featured = formData.get('is_featured') === 'true';
  const is_published = formData.get('is_published') === 'true';
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);

  // 1. Validate URL rigorously on the server
  const urlValidation = validateAndNormalizeUrl(raw_website_url);
  if (!urlValidation.isValid || !urlValidation.normalizedUrl) {
    return {
      success: false,
      error: urlValidation.error || 'رابط الموقع الإلكتروني غير صالح (يجب أن يبدأ بـ https:// حصراً)',
    };
  }
  const website_url = urlValidation.normalizedUrl;

  // 2. Validate & Auto-generate Slug if missing
  if (!slug) {
    slug = generateClientSlug(name_en, name_ar);
  } else {
    slug = generateClientSlug(slug);
  }

  // 3. Check for Slug Uniqueness against other records
  const supabase = createClient();
  let slugQuery = supabase.from('clients').select('id').eq('slug', slug);
  if (id) {
    slugQuery = slugQuery.neq('id', id);
  }
  const { data: existingSlug } = await slugQuery;
  if (existingSlug && existingSlug.length > 0) {
    return {
      success: false,
      error: `المعرف اللطيف (Slug) "${slug}" مستخدم بالفعل لعميل آخر. يرجى اختيار معرّف مختلف.`,
    };
  }

  // 4. Logo is mandatory
  if (!logo) {
    return {
      success: false,
      error: 'شعار العميل مطلوب',
    };
  }

  const payload = {
    name_ar,
    name_en,
    slug,
    description_ar,
    description_en,
    website_url,
    logo,
    cover_image,
    category_id,
    is_featured,
    is_published,
    sort_order,
  };

  let result;
  if (id) {
    result = await updateClientRecord(id, payload);
  } else {
    result = await createClientRecord(payload);
  }

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل حفظ بيانات العميل' };
  }

  revalidatePublicPaths('/ar/clients');
  revalidatePublicPaths('/en/clients');
  revalidatePath('/admin/clients');
  return { success: true };
}

export async function toggleClientFeaturedAction(id: string, is_featured: boolean): Promise<ClientActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await updateClientRecord(id, { is_featured });
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePublicPaths('/ar/clients');
  revalidatePublicPaths('/en/clients');
  revalidatePath('/admin/clients');
  return { success: true };
}

export async function toggleClientPublishedAction(id: string, is_published: boolean): Promise<ClientActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await updateClientRecord(id, { is_published });
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePublicPaths('/ar/clients');
  revalidatePublicPaths('/en/clients');
  revalidatePath('/admin/clients');
  return { success: true };
}

export async function reorderClientsAction(orderedIds: string[]): Promise<ClientActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await reorderClients(orderedIds);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل تحديث الترتيب' };
  }

  revalidatePublicPaths('/ar/clients');
  revalidatePublicPaths('/en/clients');
  revalidatePath('/admin/clients');
  return { success: true };
}

export async function deleteClientAction(id: string): Promise<ClientActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await deleteClientRecord(id);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل حذف العميل ومرفقاته' };
  }

  revalidatePublicPaths('/ar/clients');
  revalidatePublicPaths('/en/clients');
  revalidatePath('/admin/clients');
  return { success: true };
}

export async function bulkDeleteClientsAction(ids: string[]): Promise<ClientActionResponse> {
  await requireRole(['owner', 'editor']);

  if (!ids || ids.length === 0) {
    return { success: false, error: 'لم يتم تحديد أي عملاء للحذف' };
  }

  const result = await deleteMultipleClients(ids);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل حذف مجموعة العملاء المحددة' };
  }

  revalidatePublicPaths('/ar/clients');
  revalidatePublicPaths('/en/clients');
  revalidatePath('/admin/clients');
  return { success: true, count: result.count };
}
