/**
 * URL Safety Validation and Slug Generation Utilities for Hader Clients.
 */

// Arabic letter transliteration map for transliterating Arabic client names
const ARABIC_TO_LATIN: Record<string, string> = {
  'أ': 'a', 'إ': 'a', 'آ': 'a', 'ا': 'a', 'ء': '', 'ئ': 'e', 'ؤ': 'o',
  'ب': 'b', 'ت': 't', 'ة': 'ah', 'ث': 'th',
  'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
  'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
  'ي': 'y', 'ى': 'a',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Transliterates Arabic text to a clean Latin equivalent.
 */
export function transliterateArabic(arabicText: string): string {
  if (!arabicText) return '';
  return arabicText
    .split('')
    .map((char) => (ARABIC_TO_LATIN[char] !== undefined ? ARABIC_TO_LATIN[char] : char))
    .join('');
}

/**
 * Generates a clean, lowercase, URL-friendly slug.
 * Handles English names, Arabic-only names (via phonetic transliteration),
 * special characters, whitespace, and guarantees a valid slug format.
 *
 * @param nameEn Primary English name
 * @param nameAr Optional Arabic name fallback
 * @param existingSlugs Optional list of existing slugs to ensure uniqueness
 */
export function generateClientSlug(
  nameEn: string,
  nameAr?: string,
  existingSlugs: string[] = []
): string {
  let raw = (nameEn || '').trim();

  // If no English name provided, use Arabic name with transliteration
  if (!raw && nameAr) {
    raw = transliterateArabic(nameAr.trim());
  }

  // Normalize: lower case, replace accents, replace spaces/punctuation with hyphens
  let slug = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/['"’`]/g, '') // remove quotes
    .replace(/[^a-z0-9]+/g, '-') // convert non-alphanumeric to hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .replace(/-{2,}/g, '-'); // collapse multiple hyphens

  // Edge case fallback if name was entirely symbols or unmapped characters
  if (!slug || slug.length < 2) {
    slug = `client-${Math.random().toString(36).substring(2, 7)}`;
  }

  // Ensure uniqueness if existing slugs are passed
  if (existingSlugs.length > 0) {
    let candidate = slug;
    let counter = 2;
    while (existingSlugs.includes(candidate)) {
      candidate = `${slug}-${counter}`;
      counter++;
    }
    slug = candidate;
  }

  return slug;
}

/**
 * Validates and normalizes website URLs.
 * Rejects non-HTTPS schemes (http:, javascript:, data:, file:), malformed syntax,
 * and dangerous payloads.
 */
export function validateAndNormalizeUrl(rawUrl: string): {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'رابط الموقع مطلوب' };
  }

  let trimmed = rawUrl.trim();

  // 1. Explicit dangerous scheme checks
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return {
      isValid: false,
      error: 'نوع الرابط غير مسموح به لأسباب أمنية مشددة (محاولة حقن نص برمجي)',
    };
  }

  // 2. Reject unencrypted HTTP
  if (lower.startsWith('http://')) {
    return {
      isValid: false,
      error: 'يجب أن يبدأ الرابط بـ https:// حصراً لحماية بيانات الزوار',
    };
  }

  // 3. Auto-prefix https:// if user entered domain without scheme (e.g. example.ye)
  if (!lower.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  // 4. Parse using URL constructor
  try {
    const parsed = new URL(trimmed);

    // Verify protocol is strictly https:
    if (parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'يجب استخدام بروتوكول HTTPS المشفر حصراً',
      };
    }

    // Verify hostname has at least a valid domain structure
    const hostname = parsed.hostname;
    if (!hostname || hostname.length < 3 || !hostname.includes('.')) {
      return {
        isValid: false,
        error: 'اسم النطاق (Domain) غير صالح أو غير مكتمل',
      };
    }

    // Disallow loopback / local IP addresses in production
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname === '0.0.0.0'
    ) {
      return {
        isValid: false,
        error: 'لا يمكن استخدام روابط محلية (localhost)',
      };
    }

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
    };
  } catch {
    return {
      isValid: false,
      error: 'صيغة الرابط غير صحيحة. مثال: https://example.ye',
    };
  }
}
