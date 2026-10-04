'use server';

import { requireRole } from '@/lib/auth/session';
import { createProcessStep, updateProcessStep, deleteProcessStep } from '@/lib/data/process';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ProcessActionResponse {
  success: boolean;
  error?: string;
}

export async function saveProcessStepAction(prevState: any, formData: FormData): Promise<ProcessActionResponse> {
  await requireRole(['owner', 'editor']);

  const id = (formData.get('id') as string)?.trim();
  const step_number = parseInt((formData.get('step_number') as string) || '1', 10);
  const title_ar = (formData.get('title_ar') as string)?.trim() || '';
  const title_en = (formData.get('title_en') as string)?.trim() || '';
  const description_ar = (formData.get('description_ar') as string)?.trim() || '';
  const description_en = (formData.get('description_en') as string)?.trim() || '';
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  const is_visible = formData.get('is_visible') === 'true';

  const payload = {
    step_number,
    title_ar,
    title_en,
    description_ar,
    description_en,
    sort_order,
    is_visible,
  };

  let result;
  if (id) {
    result = await updateProcessStep(id, payload);
  } else {
    result = await createProcessStep(payload);
  }

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل حفظ خطوة العمل' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/process');
  return { success: true };
}

export async function toggleProcessStepVisibilityAction(id: string, is_visible: boolean): Promise<ProcessActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await updateProcessStep(id, { is_visible });
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/process');
  return { success: true };
}

export async function reorderProcessStepsAction(orderedIds: string[]): Promise<ProcessActionResponse> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('process_steps').update({ sort_order: index, step_number: index + 1 }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return { success: false, error: 'حدث خطأ أثناء حفظ الترتيب الجديد' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/process');
  return { success: true };
}

export async function deleteProcessStepAction(id: string): Promise<ProcessActionResponse> {
  await requireRole(['owner', 'editor']);

  const result = await deleteProcessStep(id);
  if (!result.success) {
    return { success: false, error: result.error || 'فشل حذف خطوة العمل' };
  }

  revalidatePublicPaths();
  revalidatePath('/admin/process');
  return { success: true };
}
