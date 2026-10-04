import { createClient } from '@/lib/supabase/server';
import { Profile } from './types';
import { profileSchema, ProfileInput } from '@/lib/validation';

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as Profile;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error.message);
    return [];
  }

  return (data as Profile[]) || [];
}

export async function upsertUserProfile(input: ProfileInput): Promise<{ data: Profile | null; error: string | null }> {
  const validated = profileSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile, error: null };
}

export async function deleteUserProfile(userId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('profiles').delete().eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
