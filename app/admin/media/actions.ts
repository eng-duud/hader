'use server';

import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { revalidatePublicPaths } from '@/lib/data/revalidate';
import { revalidatePath } from 'next/cache';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { MediaItem } from '@/lib/data/types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface MediaUploadResponse {
  success: boolean;
  media?: MediaItem;
  error?: string;
}

export interface MediaDeleteResponse {
  success: boolean;
  inUse?: boolean;
  usages?: string[];
  error?: string;
}

/**
 * Sanitize a filename to prevent path traversal or filesystem hazards.
 */
function sanitizeFilename(filename: string): string {
  const base = filename.replace(/^.*[\\\/]/, ''); // remove any directories
  const clean = base
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
  return clean || 'upload.bin';
}

export async function uploadMediaAction(formData: FormData): Promise<MediaUploadResponse> {
  await requireRole(['owner', 'editor']);

  const file = formData.get('file') as File | null;
  const alt_ar = (formData.get('alt_ar') as string)?.trim() || '';
  const alt_en = (formData.get('alt_en') as string)?.trim() || '';

  if (!file || file.size === 0) {
    return { success: false, error: 'يرجى اختيار ملف صالح للرفع' };
  }

  // 1. Max size check (5MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `حجم الملف (${(file.size / (1024 * 1024)).toFixed(2)} ميجابايت) يتجاوز الحد الأقصى المسموح به (5 ميجابايت)`,
    };
  }

  // 2. MIME type allowlist
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `نوع الملف (${file.type || 'غير معروف'}) غير مدعوم. الصيغ المدعومة: JPG, PNG, WebP, SVG`,
    };
  }

  // 3. SVG sanitization
  let fileBuffer: Buffer;
  const arrayBuffer = await file.arrayBuffer();
  fileBuffer = Buffer.from(arrayBuffer);

  if (file.type === 'image/svg+xml') {
    const svgText = fileBuffer.toString('utf-8');
    const sanitizedSvg = sanitizeHtml(svgText);
    fileBuffer = Buffer.from(sanitizedSvg, 'utf-8');
  }

  // 4. Filename sanitization and unique path
  const sanitizedName = sanitizeFilename(file.name);
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const storagePath = `uploads/${uniquePrefix}-${sanitizedName}`;

  const supabase = createClient();

  // Upload to Supabase Storage bucket 'media'
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: `فشل تخزين الملف: ${uploadError.message}` };
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('media')
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData.publicUrl;

  // Save record in public.media table
  const { data: mediaRecord, error: dbError } = await supabase
    .from('media')
    .insert({
      storage_path: storagePath,
      public_url: publicUrl,
      alt_ar,
      alt_en,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (dbError || !mediaRecord) {
    // Attempt rollback from storage if db insert fails
    await supabase.storage.from('media').remove([storagePath]);
    return { success: false, error: dbError?.message || 'فشل تسجيل بيانات الملف' };
  }

  revalidatePath('/admin/media');
  revalidatePublicPaths();

  return { success: true, media: mediaRecord as MediaItem };
}

export async function updateMediaAltAction(
  id: string,
  alt_ar: string,
  alt_en: string
): Promise<{ success: boolean; error?: string }> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();
  const { error } = await supabase
    .from('media')
    .update({ alt_ar: alt_ar.trim(), alt_en: alt_en.trim() })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/media');
  revalidatePublicPaths();
  return { success: true };
}

/**
 * Checks if a media item is currently referenced anywhere in the database.
 */
export async function checkMediaInUseAction(id: string): Promise<{ inUse: boolean; usages: string[] }> {
  await requireRole(['owner', 'editor']);

  const supabase = createClient();
  const usages: string[] = [];

  const { data: media } = await supabase
    .from('media')
    .select('public_url, storage_path')
    .eq('id', id)
    .single();

  if (!media) {
    return { inUse: false, usages: [] };
  }

  const url = media.public_url;
  const path = media.storage_path;

  // 1. Check site_settings (og_image_url)
  const { data: settings } = await supabase
    .from('site_settings')
    .select('og_image_url')
    .limit(1)
    .single();

  if (settings?.og_image_url && (settings.og_image_url === url || settings.og_image_url === path)) {
    usages.push('إعدادات الموقع (صورة المشاركة الافتراضية OpenGraph)');
  }

  // 2. Check clients (logo, cover_image)
  const { data: clients } = await supabase
    .from('clients')
    .select('name_ar, name_en, logo, cover_image')
    .or(`logo.eq.${url},logo.eq.${path},cover_image.eq.${url},cover_image.eq.${path}`);

  if (clients && clients.length > 0) {
    clients.forEach((c) => {
      usages.push(`عميل: ${c.name_ar || c.name_en}`);
    });
  }

  // 3. Check content_blocks (e.g. if the image url is embedded in text/markdown)
  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('key, value_ar, value_en');

  if (blocks) {
    blocks.forEach((b) => {
      if (b.value_ar?.includes(url) || b.value_en?.includes(url)) {
        usages.push(`نص/صفحة: ${b.key}`);
      }
    });
  }

  return {
    inUse: usages.length > 0,
    usages,
  };
}

export async function deleteMediaAction(
  id: string,
  force: boolean = false
): Promise<MediaDeleteResponse> {
  await requireRole(['owner', 'editor']);

  const inUseCheck = await checkMediaInUseAction(id);
  if (inUseCheck.inUse && !force) {
    return {
      success: false,
      inUse: true,
      usages: inUseCheck.usages,
      error: `لا يمكن حذف هذا الملف فوراً لأنه قيد الاستخدام في: ${inUseCheck.usages.join('، ')}`,
    };
  }

  const supabase = createClient();

  const { data: item } = await supabase
    .from('media')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (item?.storage_path) {
    await supabase.storage.from('media').remove([item.storage_path]);
  }

  const { error: dbError } = await supabase.from('media').delete().eq('id', id);
  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath('/admin/media');
  revalidatePublicPaths();
  return { success: true };
}
