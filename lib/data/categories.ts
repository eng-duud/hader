import { createClient } from '@/lib/supabase/server';
import { ClientCategory } from './types';
import { clientCategorySchema, ClientCategoryInput } from '@/lib/validation';

export async function getClientCategories(): Promise<ClientCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching client categories:', error.message);
    return [];
  }

  return (data as ClientCategory[]) || [];
}

export async function createClientCategory(input: ClientCategoryInput): Promise<{ data: ClientCategory | null; error: string | null }> {
  const validated = clientCategorySchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_categories')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ClientCategory, error: null };
}

export async function updateClientCategory(id: string, input: Partial<ClientCategoryInput>): Promise<{ data: ClientCategory | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ClientCategory, error: null };
}

export async function deleteClientCategory(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('client_categories').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
