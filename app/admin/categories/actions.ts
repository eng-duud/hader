'use server';

import { requireRole } from '@/lib/auth/session';
import { createClientCategory, updateClientCategory, deleteClientCategory } from '@/lib/data/categories';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface CategoryActionResponse {
  success: boolean;
  error?: string;
}

export async function saveCategoryAction(prevState: any, formData: FormData): Promise<CategoryActionResponse> {
  await requireRole(['owner', 'editor']);

  const id = (formData.get('id') as string)?.trim();
  const slug = (formData.get('slug') as string)?.trim()?.toLowerCase();
  const name_ar = (formData.get('name_ar') as string)?.trim() || '';
  const name_en = (formData.get('name_en') as string)?.trim() || '';
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);

  if (!slug) {
    return { success: false, error: 'المعرف اللطيف (Slug) مطلوب' };
  }

  const payload = {
    slug,
    name_ar,
    name_en,
    sort_order,
  };

  let result;
  if (id) {
    result = await updateClientCategory(id, payload);
  } else {
    result = await createClientCategory(payload);
  }

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل حفظ التصنيف' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/categories');
  return { success: true };
}

export async function reorderCategoriesAction(orderedIds: string[]): Promise<CategoryActionResponse> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('client_categories').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, error: 'حدث خطأ أثناء حفظ الترتيب الجديد' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/categories');
  return { success: true };
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionResponse> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();

  // Safety check: is any client using this category?
  const { count, error: countErr } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (!countErr && count && count > 0) {
    return {
      success: false,
      error: `لا يمكن حذف هذا التصنيف لوجود ${count} عميل مرتبط به. يرجى نقلهم أو تغيير تصنيفهم أولاً.`,
    };
  }

  const result = await deleteClientCategory(id);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل حذف التصنيف' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/categories');
  return { success: true };
}
