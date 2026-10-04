import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Lead } from './types';
import { leadSchema, LeadInput } from '@/lib/validation';

/**
 * Inserts a lead using the server-side service-role admin client.
 * This ensures the public client never accesses or leaks the service key,
 * and anon browser calls cannot bypass spam checks or directly inspect leads.
 */
export async function submitLead(input: LeadInput, ipHash?: string): Promise<{ data: Lead | null; error: string | null }> {
  const validated = leadSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  // Honeypot anti-spam check
  if (input.honeypot && input.honeypot.length > 0) {
    return { data: null, error: 'Invalid submission' };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('leads')
      .insert({
        name: validated.data.name,
        business_name: validated.data.business_name,
        phone: validated.data.phone,
        email: validated.data.email || null,
        interests: validated.data.interests,
        message: validated.data.message,
        locale: validated.data.locale,
        source_page: validated.data.source_page,
        user_agent: validated.data.user_agent || null,
        ip_hash: ipHash || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Lead, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Server error creating lead' };
  }
}

export async function getLeads(status?: string): Promise<Lead[]> {
  const supabase = createClient();
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching leads:', error.message);
    return [];
  }

  return (data as Lead[]) || [];
}

export async function updateLeadStatus(
  id: string,
  status: 'new' | 'contacted' | 'won' | 'lost',
  notes?: string
): Promise<{ data: Lead | null; error: string | null }> {
  const supabase = createClient();
  const updatePayload: Record<string, any> = { status };
  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Lead, error: null };
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as Lead;
}

export async function deleteLead(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

