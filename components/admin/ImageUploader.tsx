'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploaderProps {
  label: string;
  value?: string;
  onChange: (publicUrl: string) => void;
  description?: string;
  folder?: string;
  maxSizeBytes?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value = '',
  onChange,
  description = 'PNG, JPG, WebP أو SVG (بحد أقصى 5 ميجابايت)',
  folder = 'uploads',
  maxSizeBytes = 5242880,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // 1. Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة PNG أو JPG أو WebP أو SVG.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setError('حجم الصورة يتجاوز الحد المسموح به (5 ميجابايت).');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-typography-primary">
        {label}
      </label>

      {value ? (
        <div className="relative inline-block overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated p-2 shadow-sm">
          <div className="relative h-40 w-40 sm:h-48 sm:w-48">
            <Image
              src={value}
              alt={label}
              fill
              className="object-contain rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-3 end-3 flex h-7 w-7 items-center justify-center rounded-full bg-status-error text-white shadow-md hover:bg-status-error/90 focus:outline-none"
            title="حذف الصورة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-surface-sunken/40 px-6 py-8 text-center transition-colors hover:border-brand-accent hover:bg-surface-sunken/80"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
              <p className="text-sm font-medium text-typography-primary">جاري رفع الصورة...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-brand-accent shadow-sm">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-typography-primary">
                اضغط لاختيار صورة أو اسحبها هنا
              </p>
              <p className="text-xs text-typography-muted">{description}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-status-error">{error}</p>
      )}
    </div>
  );
};
