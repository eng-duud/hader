import { createClient } from '@/lib/supabase/server';
import { Client } from './types';
import { clientSchema, ClientInput } from '@/lib/validation';

export async function getFeaturedClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*, category:client_categories(*)')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching featured clients:', error.message);
    return [];
  }

  return (data as Client[]) || [];
}

export async function getPublicClients(categoryId?: string): Promise<Client[]> {
  const supabase = createClient();
  let query = supabase
    .from('clients')
    .select('*, category:client_categories(*)')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching public clients:', error.message);
    return [];
  }

  return (data as Client[]) || [];
}

export async function getAllClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*, category:client_categories(*)')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all clients:', error.message);
    return [];
  }

  return (data as Client[]) || [];
}

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*, category:client_categories(*)')
    .eq('slug', slug)
    .single();

  if (error) {
    return null;
  }

  return data as Client;
}

export async function createClientRecord(input: ClientInput): Promise<{ data: Client | null; error: string | null }> {
  const validated = clientSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Client, error: null };
}

export async function updateClientRecord(id: string, input: Partial<ClientInput>): Promise<{ data: Client | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Client, error: null };
}

export function extractStoragePath(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;
  if (urlOrPath.includes('/storage/v1/object/public/media/')) {
    return urlOrPath.split('/storage/v1/object/public/media/')[1] || null;
  }
  if (urlOrPath.startsWith('uploads/')) {
    return urlOrPath;
  }
  return null;
}

export async function deleteClientRecord(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  // 1. Fetch images to delete from storage
  const { data: client } = await supabase
    .from('clients')
    .select('logo, cover_image')
    .eq('id', id)
    .single();

  // 2. Delete database record
  const { error } = await supabase.from('clients').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Delete stored images from Storage safely
  const pathsToRemove: string[] = [];
  const logoPath = extractStoragePath(client?.logo);
  if (logoPath) pathsToRemove.push(logoPath);
  const coverPath = extractStoragePath(client?.cover_image);
  if (coverPath) pathsToRemove.push(coverPath);

  if (pathsToRemove.length > 0) {
    try {
      await supabase.storage.from('media').remove(pathsToRemove);
      await supabase.from('media').delete().in('storage_path', pathsToRemove);
    } catch (storageErr) {
      console.warn('Storage image cleanup non-fatal warning:', storageErr);
    }
  }

  return { success: true, error: null };
}

export async function deleteMultipleClients(ids: string[]): Promise<{ success: boolean; error: string | null; count?: number }> {
  if (!ids || ids.length === 0) {
    return { success: true, error: null, count: 0 };
  }

  const supabase = createClient();

  // 1. Fetch all images to clean up
  const { data: clients } = await supabase
    .from('clients')
    .select('logo, cover_image')
    .in('id', ids);

  // 2. Delete database records
  const { error } = await supabase.from('clients').delete().in('id', ids);

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Collect storage paths and remove
  const pathsToRemove: string[] = [];
  if (clients) {
    for (const c of clients) {
      const lp = extractStoragePath(c.logo);
      if (lp) pathsToRemove.push(lp);
      const cp = extractStoragePath(c.cover_image);
      if (cp) pathsToRemove.push(cp);
    }
  }

  if (pathsToRemove.length > 0) {
    try {
      await supabase.storage.from('media').remove(pathsToRemove);
      await supabase.from('media').delete().in('storage_path', pathsToRemove);
    } catch (storageErr) {
      console.warn('Storage bulk image cleanup warning:', storageErr);
    }
  }

  return { success: true, error: null, count: ids.length };
}

export async function reorderClients(orderedIds: string[]): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from('clients').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failure = results.find((r) => r.error);
  if (failure && failure.error) {
    return { success: false, error: failure.error.message };
  }

  return { success: true, error: null };
}
