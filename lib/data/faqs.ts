import { createClient } from '@/lib/supabase/server';
import { FAQ } from './types';
import { faqSchema, FaqInput } from '@/lib/validation';

export async function getPublicFaqs(): Promise<FAQ[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching public FAQs:', error.message);
    return [];
  }

  return (data as FAQ[]) || [];
}

export async function getAllFaqs(): Promise<FAQ[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all FAQs:', error.message);
    return [];
  }

  return (data as FAQ[]) || [];
}

export async function createFaq(input: FaqInput): Promise<{ data: FAQ | null; error: string | null }> {
  const validated = faqSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as FAQ, error: null };
}

export async function updateFaq(id: string, input: Partial<FaqInput>): Promise<{ data: FAQ | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as FAQ, error: null };
}

export async function deleteFaq(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('faqs').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
