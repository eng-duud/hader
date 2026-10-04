import { createClient } from '@/lib/supabase/server';
import { MediaItem } from './types';
import { mediaSchema, MediaInput } from '@/lib/validation';

export async function getMediaList(): Promise<MediaItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching media:', error.message);
    return [];
  }

  return (data as MediaItem[]) || [];
}

export async function createMediaRecord(input: MediaInput): Promise<{ data: MediaItem | null; error: string | null }> {
  const validated = mediaSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('media')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as MediaItem, error: null };
}

export async function deleteMediaRecord(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  // First fetch storage path to delete file from bucket
  const { data: item } = await supabase
    .from('media')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (item?.storage_path) {
    await supabase.storage.from('media').remove([item.storage_path]);
  }

  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
