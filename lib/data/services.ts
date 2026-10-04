import { createClient } from '@/lib/supabase/server';
import { Service } from './types';
import { serviceSchema, ServiceInput } from '@/lib/validation';

export async function getPublicServices(): Promise<Service[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching public services:', error.message);
    return [];
  }

  return (data as Service[]) || [];
}

export async function getAllServices(): Promise<Service[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all services:', error.message);
    return [];
  }

  return (data as Service[]) || [];
}

export async function createService(input: ServiceInput): Promise<{ data: Service | null; error: string | null }> {
  const validated = serviceSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Service, error: null };
}

export async function updateService(id: string, input: Partial<ServiceInput>): Promise<{ data: Service | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('services')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Service, error: null };
}

export async function deleteService(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
