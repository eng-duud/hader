import { createClient } from '@/lib/supabase/server';
import { ProcessStep } from './types';
import { processStepSchema, ProcessStepInput } from '@/lib/validation';

export async function getPublicProcessSteps(): Promise<ProcessStep[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('process_steps')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching public process steps:', error.message);
    return [];
  }

  return (data as ProcessStep[]) || [];
}

export async function getAllProcessSteps(): Promise<ProcessStep[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('process_steps')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all process steps:', error.message);
    return [];
  }

  return (data as ProcessStep[]) || [];
}

export async function createProcessStep(input: ProcessStepInput): Promise<{ data: ProcessStep | null; error: string | null }> {
  const validated = processStepSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('process_steps')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ProcessStep, error: null };
}

export async function updateProcessStep(id: string, input: Partial<ProcessStepInput>): Promise<{ data: ProcessStep | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('process_steps')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ProcessStep, error: null };
}

export async function deleteProcessStep(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('process_steps').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
