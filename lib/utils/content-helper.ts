import { ContentBlock } from '@/lib/data/types';

/**
 * Retrieves a localized string from a content block with graceful fallback:
 * 1. Current locale value if non-empty
 * 2. Opposite locale value if non-empty
 * 3. Fallback default string
 */
export function getLocalizedBlock(
  blocks: Record<string, ContentBlock> | null | undefined,
  key: string,
  locale: string = 'ar',
  fallback: string = ''
): string {
  if (!blocks || !blocks[key]) {
    return fallback;
  }

  const block = blocks[key];
  if (locale === 'ar') {
    return block.value_ar?.trim() || block.value_en?.trim() || fallback;
  }
  return block.value_en?.trim() || block.value_ar?.trim() || fallback;
}

/**
 * Returns localized text from an AR/EN field pair with automatic fallback.
 */
export function getLocalizedText(
  arVal?: string | null,
  enVal?: string | null,
  locale: string = 'ar',
  fallback: string = ''
): string {
  const ar = arVal?.trim();
  const en = enVal?.trim();

  if (locale === 'ar') {
    return ar || en || fallback;
  }
  return en || ar || fallback;
}
