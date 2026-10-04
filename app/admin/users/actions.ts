'use server';

import { requireRole } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UserActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Invites a new team member by creating a user with the specified role.
 * Protected: Owner only.
 */
export async function inviteUserAction(prevState: any, formData: FormData): Promise<UserActionResponse> {
  // 1. Strict Server-Side Role Guard
  await requireRole(['owner']);

  const email = (formData.get('email') as string)?.trim()?.toLowerCase();
  const password = formData.get('password') as string;
  const fullName = (formData.get('fullName') as string)?.trim();
  const role = (formData.get('role') as 'owner' | 'editor') || 'editor';

  if (!email || !password) {
    return { success: false, error: 'البريد الإلكتروني وكلمة المرور المؤقتة مطلوبان' };
  }

  if (password.length < 8) {
    return { success: false, error: 'كلمة المرور يجب ألا تقل عن 8 خانات' };
  }

  try {
    const admin = createAdminClient();

    // Create user in auth.users
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !newUser.user) {
      return { success: false, error: createError?.message || 'فشل إنشاء حساب المستخدم' };
    }

    // Insert role into profiles table
    const { error: profileError } = await admin.from('profiles').upsert({
      user_id: newUser.user.id,
      role,
      full_name: fullName,
    });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء دعوة المستخدم' };
  }
}

/**
 * Updates an existing user's role (owner <-> editor).
 * Protected: Owner only.
 */
export async function updateUserRoleAction(targetUserId: string, newRole: 'owner' | 'editor'): Promise<UserActionResponse> {
  // 1. Strict Server-Side Role Guard
  const { user } = await requireRole(['owner']);

  // Prevent self-demotion if the current user is modifying themselves
  if (targetUserId === user.id && newRole !== 'owner') {
    return { success: false, error: 'لا يمكنك تغيير صلاحيات حسابك الخاص لمنع قفل النظام' };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('user_id', targetUserId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تحديث الصلاحية' };
  }
}

/**
 * Removes a user account.
 * Protected: Owner only.
 */
export async function removeUserAction(targetUserId: string): Promise<UserActionResponse> {
  // 1. Strict Server-Side Role Guard
  const { user } = await requireRole(['owner']);

  if (targetUserId === user.id) {
    return { success: false, error: 'لا يمكنك حذف حسابك الحالي' };
  }

  try {
    const admin = createAdminClient();

    // Delete user from auth (cascades to profiles)
    const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل حذف المستخدم' };
  }
}
