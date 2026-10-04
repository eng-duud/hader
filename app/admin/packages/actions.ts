'use server';

import { requireRole } from '@/lib/auth/session';
import { createPackage, updatePackage, deletePackage } from '@/lib/data/packages';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface PackageActionResponse {
  success: boolean;
  error?: string;
}

export async function savePackageAction(prevState: any, formData: FormData): Promise<PackageActionResponse> {
  await requireRole(['owner', 'editor']);

  const id = (formData.get('id') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim()?.toLowerCase();
  const name_ar = (formData.get('name_ar') as string)?.trim() || '';
  const name_en = (formData.get('name_en') as string)?.trim() || '';
  const description_ar = (formData.get('description_ar') as string)?.trim() || '';
  const description_en = (formData.get('description_en') as string)?.trim() || '';
  const priceRaw = (formData.get('price_cents') as string)?.trim();
  const price_cents = priceRaw ? parseInt(priceRaw, 10) : null;
  const currency = (formData.get('currency') as string)?.trim() || 'YER';
  const is_highlighted = formData.get('is_highlighted') === 'true';
  const is_visible = formData.get('is_visible') === 'true';
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);

  const featuresArRaw = formData.get('features_ar') as string;
  const featuresEnRaw = formData.get('features_en') as string;

  let features_ar: string[] = [];
  let features_en: string[] = [];
  try {
    features_ar = featuresArRaw ? JSON.parse(featuresArRaw) : [];
    features_en = featuresEnRaw ? JSON.parse(featuresEnRaw) : [];
  } catch {
    features_ar = [];
    features_en = [];
  }

  if (!slug) {
    return { success: false, error: 'المعرف اللطيف (Slug) مطلوب' };
  }

  const payload = {
    slug,
    name_ar,
    name_en,
    description_ar,
    description_en,
    features_ar,
    features_en,
    price_cents,
    currency,
    is_highlighted,
    is_visible,
    sort_order,
  };

  let result;
  if (id) {
    result = await updatePackage(id, payload);
  } else {
    result = await createPackage(payload);
  }

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل حفظ الباقة' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/packages');
  return { success: true };
}

export async function togglePackageVisibilityAction(id: string, is_visible: boolean): Promise<PackageActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await updatePackage(id, { is_visible });
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/packages');
  return { success: true };
}

export async function reorderPackagesAction(orderedIds: string[]): Promise<PackageActionResponse> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('packages').update({ sort_order: index + 1 }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failure = results.find((r) => r.error);
  if (failure?.error) {
    return { success: false, error: failure.error.message };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/packages');
  return { success: true };
}

export async function deletePackageAction(id: string): Promise<PackageActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await deletePackage(id);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل حذف الباقة' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/packages');
  return { success: true };
}
