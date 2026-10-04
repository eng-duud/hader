import { createClient } from '@/lib/supabase/server';
import { ContentBlock } from './types';
import { contentBlockSchema, ContentBlockInput } from '@/lib/validation';

export async function getContentBlocks(): Promise<Record<string, ContentBlock>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .select('*');

  if (error) {
    console.error('Error fetching content_blocks:', error.message);
    return {};
  }

  const map: Record<string, ContentBlock> = {};
  for (const block of (data as ContentBlock[])) {
    map[block.key] = block;
  }
  return map;
}

export async function getContentBlockByKey(key: string): Promise<ContentBlock | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    return null;
  }

  return data as ContentBlock;
}

export async function upsertContentBlock(input: ContentBlockInput): Promise<{ data: ContentBlock | null; error: string | null }> {
  const validated = contentBlockSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.errors[0]?.message || 'Validation failed' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .upsert(validated.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ContentBlock, error: null };
}
