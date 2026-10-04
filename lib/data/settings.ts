import { createClient } from '@/lib/supabase/server';
import { SiteSettings } from './types';
import { siteSettingsSchema, SiteSettingsInput } from '@/lib/validation';

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching site_settings:', error.message);
    return null;
  }

  return data as SiteSettings;
}

export async function updateSiteSettings(input: SiteSettingsInput): Promise<{ data: SiteSettings | null; error: string | null }> {
  const validated = siteSettingsSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, ...validated.data })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as SiteSettings, error: null };
}
