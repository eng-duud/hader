'use server';

import { requireRole } from '@/lib/auth/session';
import { createService, updateService, deleteService } from '@/lib/data/services';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ServiceActionResponse {
  success: boolean;
  error?: string;
}

export async function saveServiceAction(prevState: any, formData: FormData): Promise<ServiceActionResponse> {
  await requireRole(['owner', 'editor']);

  const id = (formData.get('id') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim()?.toLowerCase();
  const title_ar = (formData.get('title_ar') as string)?.trim() || '';
  const title_en = (formData.get('title_en') as string)?.trim() || '';
  const description_ar = (formData.get('description_ar') as string)?.trim() || '';
  const description_en = (formData.get('description_en') as string)?.trim() || '';
  const icon = (formData.get('icon') as string)?.trim() || 'Globe';
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  const is_visible = formData.get('is_visible') === 'true';

  if (!slug) {
    return { success: false, error: 'المعرف اللطيف (Slug) مطلوب' };
  }

  const payload = {
    slug,
    title_ar,
    title_en,
    description_ar,
    description_en,
    icon,
    sort_order,
    is_visible,
  };

  let result;
  if (id) {
    result = await updateService(id, payload);
  } else {
    result = await createService(payload);
  }

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل حفظ الخدمة' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/services');
  return { success: true };
}

export async function toggleServiceVisibilityAction(id: string, is_visible: boolean): Promise<ServiceActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await updateService(id, { is_visible });
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/services');
  return { success: true };
}

export async function reorderServicesAction(orderedIds: string[]): Promise<ServiceActionResponse> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('services').update({ sort_order: index + 1 }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failure = results.find((r) => r.error);
  if (failure?.error) {
    return { success: false, error: failure.error.message };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/services');
  return { success: true };
}

export async function deleteServiceAction(id: string): Promise<ServiceActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await deleteService(id);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل حذف الخدمة' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/services');
  return { success: true };
}
