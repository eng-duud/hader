'use client';

import React, { useState, useRef } from 'react';
import { MediaItem } from '@/lib/data/types';
import {
  uploadMediaAction,
  updateMediaAltAction,
  checkMediaInUseAction,
  deleteMediaAction,
} from './actions';
import { BilingualField } from '@/components/admin/BilingualField';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';
import {
  Upload,
  Copy,
  Check,
  Trash2,
  Edit2,
  Image as ImageIcon,
  AlertTriangle,
  X,
  FileCode,
  Search,
} from 'lucide-react';

interface MediaClientProps {
  initialMedia: MediaItem[];
}

export const MediaClient: React.FC<MediaClientProps> = ({ initialMedia }) => {
  const { showToast } = useToast();
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [altAr, setAltAr] = useState('');
  const [altEn, setAltEn] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Alt Modal state
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editAltAr, setEditAltAr] = useState('');
  const [editAltEn, setEditAltEn] = useState('');
  const [savingAlt, setSavingAlt] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [inUseUsages, setInUseUsages] = useState<string[]>([]);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Copied URL feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الملف يتجاوز 5 ميجابايت', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('يرجى اختيار ملف للصورة أولاً', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('alt_ar', altAr);
    formData.append('alt_en', altEn);

    const result = await uploadMediaAction(formData);
    setUploading(false);

    if (result.success && result.media) {
      showToast('تم رفع الصورة وإضافتها للمكتبة بنجاح', 'success');
      setMediaList((prev) => [result.media!, ...prev]);
      setUploadFile(null);
      setAltAr('');
      setAltEn('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      showToast(result.error || 'فشل رفع الملف', 'error');
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.public_url);
    setCopiedId(item.id);
    showToast('تم نسخ رابط الصورة إلى الحافظة', 'success');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const openEditAltModal = (item: MediaItem) => {
    setEditingMedia(item);
    setEditAltAr(item.alt_ar || '');
    setEditAltEn(item.alt_en || '');
  };

  const handleSaveAlt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    setSavingAlt(true);
    const result = await updateMediaAltAction(editingMedia.id, editAltAr, editAltEn);
    setSavingAlt(false);

    if (result.success) {
      showToast('تم تحديث النص البديل للصورة', 'success');
      setMediaList((prev) =>
        prev.map((m) =>
          m.id === editingMedia.id ? { ...m, alt_ar: editAltAr, alt_en: editAltEn } : m
        )
      );
      setEditingMedia(null);
    } else {
      showToast(result.error || 'فشل التحديث', 'error');
    }
  };

  const handleDeleteClick = async (item: MediaItem) => {
    setDeleteTarget(item);
    setCheckingUsage(true);
    const check = await checkMediaInUseAction(item.id);
    setCheckingUsage(false);
    setInUseUsages(check.usages);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    // If in use, user explicitly confirmed through the dialog
    const result = await deleteMediaAction(deleteTarget.id, true);
    setDeleting(false);

    if (result.success) {
      showToast('تم حذف الصورة من المكتبة ومساحة التخزين', 'success');
      setMediaList((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      setInUseUsages([]);
    } else {
      showToast(result.error || 'فشل حذف الملف', 'error');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredMedia = mediaList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.storage_path?.toLowerCase().includes(q) ||
      m.alt_ar?.toLowerCase().includes(q) ||
      m.alt_en?.toLowerCase().includes(q) ||
      m.public_url?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-typography-primary">
          مكتبة الوسائط والصور (Media Library)
        </h1>
        <p className="mt-1 text-sm text-typography-muted">
          رفع، تنظيم، واسترجاع الصور والشعارات المستخدمة في كافة أقسام الموقع
        </p>
      </div>

      {/* Upload Box */}
      <div className="rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-sm">
        <h2 className="text-base font-bold text-typography-primary flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-brand-accent" />
          <span>رفع صورة جديدة</span>
        </h2>

        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* File Drop Area */}
            <div className="md:col-span-1">
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  uploadFile
                    ? 'border-brand-accent/60 bg-brand-accent/5'
                    : 'border-border-subtle hover:border-brand-accent/40 bg-surface-elevated/40'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated text-brand-accent mb-3 shadow-inner">
                  {uploadFile ? <Check className="w-6 h-6 text-emerald-500" /> : <Upload className="w-6 h-6" />}
                </div>

                {uploadFile ? (
                  <div className="text-center">
                    <p className="text-xs font-bold text-typography-primary truncate max-w-[200px]">
                      {uploadFile.name}
                    </p>
                    <p className="text-[11px] text-typography-muted mt-1">
                      {formatBytes(uploadFile.size)}
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-brand-accent hover:underline">
                      تغيير الملف
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs font-bold text-typography-primary">
                      انقر لاختيار صورة من جهازك
                    </p>
                    <p className="text-[11px] text-typography-muted mt-1">
                      الحد الأقصى: 5 ميجابايت (JPG, PNG, WebP, SVG)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Bilingual Alt Text Inputs */}
            <div className="md:col-span-2 space-y-4">
              <BilingualField
                label="النص البديل المعبر (Alt Text) للوصول وسيو"
                valueAr={altAr}
                valueEn={altEn}
                onChangeAr={setAltAr}
                onChangeEn={setAltEn}
                placeholderAr="وصف دقيق للصورة بالعربية (مثل: شعار مقهى الراقي في صنعاء)"
                placeholderEn="Accurate description in English (e.g. Al-Raqi Cafe logo in Sanaa)"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-accent text-surface-canvas font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'جاري الرفع والفحص...' : 'رفع إلى المكتبة'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Media Gallery / List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-typography-primary">
              ملفات المكتبة ({filteredMedia.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-typography-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو النص البديل..."
              className="w-full ps-9 pe-3 py-2 rounded-xl border border-border-subtle bg-surface-panel text-xs text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </div>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-elevated/30 p-12 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-typography-muted" />
            <p className="mt-2 text-sm font-semibold text-typography-primary">
              لا توجد صور مطابقة
            </p>
            <p className="text-xs text-typography-muted mt-1">
              استخدم أداة الرفع بالأعلى لإضافة صور إلى المكتبة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-border-subtle bg-surface-panel overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Image Preview Container */}
                <div className="relative aspect-video w-full bg-surface-sunken flex items-center justify-center overflow-hidden border-b border-border-subtle">
                  {item.mime_type === 'image/svg+xml' ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <FileCode className="w-10 h-10 text-brand-accent mb-1" />
                      <span className="text-[10px] font-mono text-typography-muted">SVG Vector</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.public_url}
                      alt={item.alt_ar || item.alt_en || 'Media image'}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Top-end Quick Copy */}
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item)}
                    className="absolute top-2 end-2 p-1.5 rounded-lg bg-surface-panel/90 text-typography-secondary hover:text-typography-primary backdrop-blur-sm shadow-sm transition-colors"
                    title="نسخ رابط الصورة"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Content & Metadata */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-typography-primary truncate" title={item.alt_ar || item.alt_en || item.storage_path}>
                      {item.alt_ar || item.alt_en || <span className="font-mono text-typography-muted text-[11px]">{item.storage_path.split('-').slice(1).join('-')}</span>}
                    </p>
                    {item.alt_ar && item.alt_en && (
                      <p className="text-[11px] text-typography-muted truncate dir-ltr text-end">
                        {item.alt_en}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-typography-muted border-t border-border-subtle pt-2">
                    <span className="font-mono">{formatBytes(item.size_bytes)}</span>
                    <span className="uppercase text-[10px] font-semibold tracking-wider">
                      {item.mime_type.split('/')[1]}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => openEditAltModal(item)}
                      className="inline-flex items-center gap-1 text-xs text-typography-secondary hover:text-typography-primary transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>النص البديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClick(item)}
                      className="inline-flex items-center gap-1 text-xs text-rose-500/80 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Alt Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h3 className="text-base font-bold text-typography-primary flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-accent" />
                <span>تعديل النص البديل (Alt Text)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingMedia(null)}
                className="text-typography-muted hover:text-typography-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlt} className="space-y-4">
              <BilingualField
                label="النص البديل المعبر"
                valueAr={editAltAr}
                valueEn={editAltEn}
                onChangeAr={setEditAltAr}
                onChangeEn={setEditAltEn}
                placeholderAr="وصف الصورة بالعربية للوصول والسيو..."
                placeholderEn="Image description in English..."
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-typography-secondary text-sm font-medium hover:bg-surface-elevated transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingAlt}
                  className="px-5 py-2 rounded-xl bg-brand-accent text-surface-canvas text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingAlt ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / In-Use Warning Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-typography-primary">
                {inUseUsages.length > 0 ? 'تنبيه: الصورة قيد الاستخدام!' : 'تأكيد حذف الصورة'}
              </h3>
            </div>

            {checkingUsage ? (
              <p className="text-sm text-typography-muted">جاري التحقق من استخدام الصورة في النظام...</p>
            ) : inUseUsages.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-rose-400 font-medium">
                  هذه الصورة مرتبطة حالياً بالأقسام التالية، حذفها سيؤدي لتعطل ظهورها هناك:
                </p>
                <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-3 max-h-36 overflow-y-auto space-y-1.5">
                  {inUseUsages.map((usage, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-typography-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{usage}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-typography-muted">
                  هل ترغب في الحذف الإجباري وإزالتها من الخادم على الرغم من ذلك؟
                </p>
              </div>
            ) : (
              <p className="text-xs text-typography-secondary leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذه الصورة من مكتبة الوسائط ومساحة التخزين؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setInUseUsages([]);
                }}
                className="px-4 py-2 rounded-xl border border-border-subtle text-typography-secondary text-sm font-medium hover:bg-surface-elevated transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleting || checkingUsage}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {deleting ? 'جاري الحذف...' : inUseUsages.length > 0 ? 'حذف إجباري' : 'حذف نهائي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
