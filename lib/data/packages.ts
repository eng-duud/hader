import { createClient } from '@/lib/supabase/server';
import { Package } from './types';
import { packageSchema, PackageInput } from '@/lib/validation';

export async function getPublicPackages(): Promise<Package[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching public packages:', error.message);
    return [];
  }

  return (data as Package[]) || [];
}

export async function getAllPackages(): Promise<Package[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all packages:', error.message);
    return [];
  }

  return (data as Package[]) || [];
}

export async function createPackage(input: PackageInput): Promise<{ data: Package | null; error: string | null }> {
  const validated = packageSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('packages')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Package, error: null };
}

export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<{ data: Package | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('packages')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Package, error: null };
}

export async function deletePackage(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('packages').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
