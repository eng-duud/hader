'use server';

import { requireRole } from '@/lib/auth/session';
import { createFaq, updateFaq, deleteFaq } from '@/lib/data/faqs';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface FaqActionResponse {
  success: boolean;
  error?: string;
}

export async function saveFaqAction(prevState: any, formData: FormData): Promise<FaqActionResponse> {
  await requireRole(['owner', 'editor']);

  const id = (formData.get('id') as string)?.trim();
  const question_ar = (formData.get('question_ar') as string)?.trim() || '';
  const question_en = (formData.get('question_en') as string)?.trim() || '';
  const answer_ar = (formData.get('answer_ar') as string)?.trim() || '';
  const answer_en = (formData.get('answer_en') as string)?.trim() || '';
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  const is_visible = formData.get('is_visible') === 'true';

  const payload = {
    question_ar,
    question_en,
    answer_ar,
    answer_en,
    sort_order,
    is_visible,
  };

  let result;
  if (id) {
    result = await updateFaq(id, payload);
  } else {
    result = await createFaq(payload);
  }

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل حفظ السؤال الشائع' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/faqs');
  return { success: true };
}

export async function toggleFaqVisibilityAction(id: string, is_visible: boolean): Promise<FaqActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await updateFaq(id, { is_visible });
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/faqs');
  return { success: true };
}

export async function reorderFaqsAction(orderedIds: string[]): Promise<FaqActionResponse> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('faqs').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, error: 'حدث خطأ أثناء حفظ الترتيب الجديد' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/faqs');
  return { success: true };
}

export async function deleteFaqAction(id: string): Promise<FaqActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await deleteFaq(id);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل حذف السؤال الشائع' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/faqs');
  return { success: true };
}
