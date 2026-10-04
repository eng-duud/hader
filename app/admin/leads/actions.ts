'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/session';
import { updateLeadStatus, deleteLead } from '@/lib/data/leads';

export interface LeadActionResult {
  success: boolean;
  error?: string;
}

export async function updateLeadStatusAction(
  id: string,
  status: 'new' | 'contacted' | 'won' | 'lost',
  notes?: string
): Promise<LeadActionResult> {
  try {
    await requireRole(['owner', 'editor']);

    const validStatuses = ['new', 'contacted', 'won', 'lost'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Invalid lead status' };
    }

    const { error } = await updateLeadStatus(id, status, notes);
    if (error) {
      return { success: false, error };
    }

    revalidatePath('/admin/leads');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized or server error' };
  }
}

export async function deleteLeadAction(id: string): Promise<LeadActionResult> {
  try {
    // Only the owner can delete leads per Brief section 6 RLS
    await requireRole(['owner']);

    const { error } = await deleteLead(id);
    if (error) {
      return { success: false, error };
    }

    revalidatePath('/admin/leads');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unauthorized or server error' };
  }
}
