import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/data/types';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export interface AuthContext {
  user: User;
  profile: Profile;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentProfile(): Promise<AuthContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    // If user has auth account but no profile record yet, assign fallback editor or null
    return null;
  }

  return {
    user,
    profile: profile as Profile,
  };
}

/**
 * Server guard: throws or redirects to /admin/login if user is not authenticated.
 */
export async function requireAuth(redirectTo: string = '/admin/login'): Promise<AuthContext> {
  const auth = await getCurrentProfile();
  if (!auth) {
    redirect(redirectTo);
  }
  return auth;
}

/**
 * Server-side RBAC guard: enforces allowed roles inside server actions and page loaders.
 * Throws an explicit error if role is insufficient. Hiding in UI is NOT sufficient.
 */
export async function requireRole(allowedRoles: ('owner' | 'editor')[]): Promise<AuthContext> {
  const auth = await requireAuth();

  if (!allowedRoles.includes(auth.profile.role)) {
    throw new Error(`Forbidden: Role '${auth.profile.role}' is not authorized to perform this operation.`);
  }

  return auth;
}
