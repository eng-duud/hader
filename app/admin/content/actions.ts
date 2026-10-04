'use server';

import { requireRole } from '@/lib/auth/session';
import { upsertContentBlock } from '@/lib/data/content';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';

export interface ContentActionResponse {
  success: boolean;
  error?: string;
}

export async function saveContentBlockAction(prevState: any, formData: FormData): Promise<ContentActionResponse> {
  // Staff Guard: Owner or Editor
  await requireRole(['owner', 'editor']);

  const key = (formData.get('key') as string)?.trim();
  const value_ar = (formData.get('value_ar') as string) || '';
  const value_en = (formData.get('value_en') as string) || '';
  const type = ((formData.get('type') as string) || 'text') as 'text' | 'markdown' | 'html';

  if (!key) {
    return { success: false, error: 'مفتاح المحتوى مفقود' };
  }

  const result = await upsertContentBlock({
    key,
    value_ar,
    value_en,
    type,
  });

  if (result.error || !result.data) {
    return { success: false, error: result.error || 'فشل حفظ قالب المحتوى' };
  }

  // On-demand cache revalidation
  revalidatePublicPaths();
  revalidatePath('/admin/content');

  return { success: true };
}
