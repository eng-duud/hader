'use client';

import React, { useState } from 'react';
import { ContentBlock } from '@/lib/data/types';
import { saveContentBlockAction } from './actions';
import { BilingualField } from '@/components/admin/BilingualField';
import { useToast } from '@/components/admin/Toast';
import { renderSafeMarkdown } from '@/lib/utils/sanitize';
import { Save, Loader2, FileText, Eye, Edit3, ShieldAlert } from 'lucide-react';

interface ContentClientProps {
  initialBlocks: Record<string, ContentBlock>;
}

export const ContentClient: React.FC<ContentClientProps> = ({ initialBlocks }) => {
  const { showToast } = useToast();
  const [blocks, setBlocks] = useState<Record<string, ContentBlock>>(initialBlocks);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Markdown Preview Toggle state for privacy & terms
  const [previewTab, setPreviewTab] = useState<Record<string, 'edit' | 'preview'>>({
    'privacy.content': 'edit',
    'terms.content': 'edit',
  });

  const getBlock = (key: string, defaultType: 'text' | 'markdown' = 'text'): ContentBlock => {
    return (
      blocks[key] || {
        key,
        value_ar: '',
        value_en: '',
        type: defaultType,
        created_at: '',
        updated_at: '',
      }
    );
  };

  const handleUpdate = (key: string, value_ar: string, value_en: string, type: 'text' | 'markdown' = 'text') => {
    setBlocks((prev) => ({
      ...prev,
      [key]: {
        ...getBlock(key, type),
        value_ar,
        value_en,
      },
    }));
  };

  async function handleSaveBlock(key: string) {
    const block = getBlock(key);
    setSavingKey(key);

    const formData = new FormData();
    formData.append('key', block.key);
    formData.append('value_ar', block.value_ar);
    formData.append('value_en', block.value_en);
    formData.append('type', block.type);

    const res = await saveContentBlockAction(null, formData);
    if (res.success) {
      showToast('تم تحديث المحتوى بنجاح وانعكاسه على الموقع العام', 'success');
    } else {
      showToast(res.error || 'فشل حفظ المحتوى', 'error');
    }
    setSavingKey(null);
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-typography-primary">
          إدارة النصوص والصفحات
        </h1>
        <p className="mt-1 text-sm text-typography-muted">
          تعديل نصوص الصفحة الرئيسية والوعود التسويقية والصفحات القانونية مع معاينة حية للماركداون
        </p>
      </div>

      {/* 1. Hero Section Texts */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold text-typography-primary">1. عنوان ووصف قسم البطل (Hero Section)</h2>
            <p className="text-xs text-typography-muted">أول نص يشاهده زائر الموقع على الصفحة الرئيسية</p>
          </div>
          <button
            type="button"
            disabled={savingKey === 'hero.title'}
            onClick={() => handleSaveBlock('hero.title')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {savingKey === 'hero.title' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>حفظ العنوان</span>
          </button>
        </div>

        <BilingualField
          label="العنوان الرئيسي (Hero Headline)"
          nameAr="hero_title_ar"
          nameEn="hero_title_en"
          valueAr={getBlock('hero.title').value_ar}
          valueEn={getBlock('hero.title').value_en}
          onChangeAr={(val) => handleUpdate('hero.title', val, getBlock('hero.title').value_en)}
          onChangeEn={(val) => handleUpdate('hero.title', getBlock('hero.title').value_ar, val)}
          required
        />

        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
          <div className="text-sm font-semibold text-typography-primary">الوصف المساعد (Hero Subtitle)</div>
          <button
            type="button"
            disabled={savingKey === 'hero.subtitle'}
            onClick={() => handleSaveBlock('hero.subtitle')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {savingKey === 'hero.subtitle' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>حفظ الوصف</span>
          </button>
        </div>

        <BilingualField
          label=""
          nameAr="hero_subtitle_ar"
          nameEn="hero_subtitle_en"
          valueAr={getBlock('hero.subtitle').value_ar}
          valueEn={getBlock('hero.subtitle').value_en}
          onChangeAr={(val) => handleUpdate('hero.subtitle', val, getBlock('hero.subtitle').value_en)}
          onChangeEn={(val) => handleUpdate('hero.subtitle', getBlock('hero.subtitle').value_ar, val)}
          isTextarea
          rows={3}
        />
      </div>

      {/* 2. Problem and Promise */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold text-typography-primary">2. وعد الأتمتة والتصعيد البشري (Problem & Promise)</h2>
            <p className="text-xs text-typography-muted">الالتزام الصريح بتوجيه الشكاوى لفريق بشري</p>
          </div>
          <button
            type="button"
            disabled={savingKey === 'problem.promise'}
            onClick={() => handleSaveBlock('problem.promise')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {savingKey === 'problem.promise' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>حفظ الوعد</span>
          </button>
        </div>

        <BilingualField
          label="نص وعد الأتمتة (Human Escalation Promise)"
          nameAr="promise_ar"
          nameEn="promise_en"
          valueAr={getBlock('problem.promise').value_ar}
          valueEn={getBlock('problem.promise').value_en}
          onChangeAr={(val) => handleUpdate('problem.promise', val, getBlock('problem.promise').value_en)}
          onChangeEn={(val) => handleUpdate('problem.promise', getBlock('problem.promise').value_ar, val)}
          isTextarea
          rows={3}
        />
      </div>

      {/* 3. Privacy Policy (Rich Markdown) */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold text-typography-primary">3. سياسة الخصوصية (Privacy Policy - Markdown)</h2>
            <p className="text-xs text-typography-muted">مطلوبة للتحقق من الأعمال لدى Meta. تدعم صياغة الماركداون مع تنظيف آمن للأكواد البرمجية.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border-subtle p-0.5 bg-surface-sunken">
              <button
                type="button"
                onClick={() => setPreviewTab((p) => ({ ...p, 'privacy.content': 'edit' }))}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                  previewTab['privacy.content'] === 'edit'
                    ? 'bg-surface-elevated text-typography-primary shadow-sm'
                    : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>تحرير</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab((p) => ({ ...p, 'privacy.content': 'preview' }))}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                  previewTab['privacy.content'] === 'preview'
                    ? 'bg-surface-elevated text-typography-primary shadow-sm'
                    : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>معاينة آمنة</span>
              </button>
            </div>
            <button
              type="button"
              disabled={savingKey === 'privacy.content'}
              onClick={() => handleSaveBlock('privacy.content')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {savingKey === 'privacy.content' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>حفظ السياسة</span>
            </button>
          </div>
        </div>

        {previewTab['privacy.content'] === 'edit' ? (
          <BilingualField
            label="محتوى سياسة الخصوصية (Markdown)"
            nameAr="privacy_ar"
            nameEn="privacy_en"
            valueAr={getBlock('privacy.content', 'markdown').value_ar}
            valueEn={getBlock('privacy.content', 'markdown').value_en}
            onChangeAr={(val) => handleUpdate('privacy.content', val, getBlock('privacy.content').value_en, 'markdown')}
            onChangeEn={(val) => handleUpdate('privacy.content', getBlock('privacy.content').value_ar, val, 'markdown')}
            isTextarea
            rows={8}
            description="يمكنك استخدام عناوين # ونصوص عريضة ** وقوائم -."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-xl border border-border-subtle bg-surface-sunken p-6">
            <div>
              <div className="font-bold text-xs text-brand-accent mb-3">معاينة العربية (مفلترة وآمنة):</div>
              <div
                dir="rtl"
                dangerouslySetInnerHTML={{
                  __html: renderSafeMarkdown(getBlock('privacy.content').value_ar),
                }}
              />
            </div>
            <div>
              <div className="font-bold text-xs text-brand-accent mb-3">English Preview (Sanitized):</div>
              <div
                dir="ltr"
                dangerouslySetInnerHTML={{
                  __html: renderSafeMarkdown(getBlock('privacy.content').value_en),
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Terms of Service (Rich Markdown) */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold text-typography-primary">4. الشروط والأحكام (Terms of Service - Markdown)</h2>
            <p className="text-xs text-typography-muted">اتفاقية استخدام خدمات الموقع والمنصة مع حماية ضد هجمات XSS البرمجية</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border-subtle p-0.5 bg-surface-sunken">
              <button
                type="button"
                onClick={() => setPreviewTab((p) => ({ ...p, 'terms.content': 'edit' }))}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                  previewTab['terms.content'] === 'edit'
                    ? 'bg-surface-elevated text-typography-primary shadow-sm'
                    : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>تحرير</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab((p) => ({ ...p, 'terms.content': 'preview' }))}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                  previewTab['terms.content'] === 'preview'
                    ? 'bg-surface-elevated text-typography-primary shadow-sm'
                    : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>معاينة آمنة</span>
              </button>
            </div>
            <button
              type="button"
              disabled={savingKey === 'terms.content'}
              onClick={() => handleSaveBlock('terms.content')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {savingKey === 'terms.content' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>حفظ الشروط</span>
            </button>
          </div>
        </div>

        {previewTab['terms.content'] === 'edit' ? (
          <BilingualField
            label="محتوى الشروط والأحكام (Markdown)"
            nameAr="terms_ar"
            nameEn="terms_en"
            valueAr={getBlock('terms.content', 'markdown').value_ar}
            valueEn={getBlock('terms.content', 'markdown').value_en}
            onChangeAr={(val) => handleUpdate('terms.content', val, getBlock('terms.content').value_en, 'markdown')}
            onChangeEn={(val) => handleUpdate('terms.content', getBlock('terms.content').value_ar, val, 'markdown')}
            isTextarea
            rows={8}
            description="يمكنك استخدام عناوين # ونصوص عريضة ** وقوائم -."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-xl border border-border-subtle bg-surface-sunken p-6">
            <div>
              <div className="font-bold text-xs text-brand-accent mb-3">معاينة العربية (مفلترة وآمنة):</div>
              <div
                dir="rtl"
                dangerouslySetInnerHTML={{
                  __html: renderSafeMarkdown(getBlock('terms.content').value_ar),
                }}
              />
            </div>
            <div>
              <div className="font-bold text-xs text-brand-accent mb-3">English Preview (Sanitized):</div>
              <div
                dir="ltr"
                dangerouslySetInnerHTML={{
                  __html: renderSafeMarkdown(getBlock('terms.content').value_en),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
