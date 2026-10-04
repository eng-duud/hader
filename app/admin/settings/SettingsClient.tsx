'use client';

import React, { useState } from 'react';
import { SiteSettings } from '@/lib/data/types';
import { saveSettingsAction } from './actions';
import { BilingualField } from '@/components/admin/BilingualField';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { UnsavedChangesGuard } from '@/components/admin/UnsavedChangesGuard';
import { useToast } from '@/components/admin/Toast';
import { Save, Loader2, Globe, Building2, Phone, Share2, Search } from 'lucide-react';

interface SettingsClientProps {
  initialSettings: SiteSettings;
}

export const SettingsClient: React.FC<SettingsClientProps> = ({ initialSettings }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    initialSettings.social_links || {}
  );
  const [ogImageUrl, setOgImageUrl] = useState<string>(initialSettings.og_image_url || '');

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
    setIsDirty(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(settings).forEach(([k, v]) => {
      if (k !== 'social_links' && k !== 'og_image_url') {
        formData.append(k, String(v ?? ''));
      }
    });

    formData.append('social_links', JSON.stringify(socialLinks));
    formData.append('og_image_url', ogImageUrl);

    const res = await saveSettingsAction(null, formData);
    if (res.success) {
      showToast('تم حفظ إعدادات المنصة بنجاح وتحديث الموقع العام', 'success');
      setIsDirty(false);
    } else {
      showToast(res.error || 'حدث خطأ أثناء حفظ الإعدادات', 'error');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <UnsavedChangesGuard isDirty={isDirty} />

      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-typography-primary">
            إعدادات المنصة والهوية
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            إدارة البيانات الرسمية ووسائل التواصل وإعدادات SEO (خاص بالمالك)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !isDirty}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-brand-primary-foreground shadow-sm hover:bg-brand-primary-hover disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      {/* Section 1: Company Legal Identity */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4 text-brand-accent">
          <Building2 className="h-5 w-5" />
          <h2 className="text-lg font-bold text-typography-primary">بيانات الهوية الرسمية للشركة</h2>
        </div>

        <BilingualField
          label="اسم الشركة الرسمي"
          nameAr="company_name_ar"
          nameEn="company_name_en"
          valueAr={settings.company_name_ar}
          valueEn={settings.company_name_en}
          onChangeAr={(val) => handleChange('company_name_ar', val)}
          onChangeEn={(val) => handleChange('company_name_en', val)}
          required
        />

        <BilingualField
          label="شعار المنصة (Tagline)"
          nameAr="tagline_ar"
          nameEn="tagline_en"
          valueAr={settings.tagline_ar}
          valueEn={settings.tagline_en}
          onChangeAr={(val) => handleChange('tagline_ar', val)}
          onChangeEn={(val) => handleChange('tagline_en', val)}
          required
        />
      </div>

      {/* Section 2: Contact Information & Hours */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4 text-brand-accent">
          <Phone className="h-5 w-5" />
          <h2 className="text-lg font-bold text-typography-primary">معلومات التواصل وساعات العمل</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-typography-primary">رقم الهاتف</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-typography-primary">رقم الواتساب</label>
            <input
              type="text"
              value={settings.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-typography-primary">البريد الإلكتروني الرسمي</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>

        <BilingualField
          label="العنوان والمقر"
          nameAr="address_ar"
          nameEn="address_en"
          valueAr={settings.address_ar}
          valueEn={settings.address_en}
          onChangeAr={(val) => handleChange('address_ar', val)}
          onChangeEn={(val) => handleChange('address_en', val)}
        />

        <BilingualField
          label="ساعات العمل"
          nameAr="working_hours_ar"
          nameEn="working_hours_en"
          valueAr={settings.working_hours_ar}
          valueEn={settings.working_hours_en}
          onChangeAr={(val) => handleChange('working_hours_ar', val)}
          onChangeEn={(val) => handleChange('working_hours_en', val)}
        />
      </div>

      {/* Section 3: Social Links */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4 text-brand-accent">
          <Share2 className="h-5 w-5" />
          <h2 className="text-lg font-bold text-typography-primary">روابط منصات التواصل الاجتماعي</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-typography-primary">منصة X (تويتر)</label>
            <input
              type="url"
              value={socialLinks.twitter || ''}
              onChange={(e) => handleSocialChange('twitter', e.target.value)}
              placeholder="https://x.com/..."
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-typography-primary">لينكد إن (LinkedIn)</label>
            <input
              type="url"
              value={socialLinks.linkedin || ''}
              onChange={(e) => handleSocialChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-typography-primary">إنستغرام (Instagram)</label>
            <input
              type="url"
              value={socialLinks.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Section 4: SEO & Analytics */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4 text-brand-accent">
          <Search className="h-5 w-5" />
          <h2 className="text-lg font-bold text-typography-primary">إعدادات محركات البحث (SEO) والتحليلات</h2>
        </div>

        <BilingualField
          label="عنوان الموقع الافتراضي (SEO Title)"
          nameAr="seo_title_ar"
          nameEn="seo_title_en"
          valueAr={settings.seo_title_ar || ''}
          valueEn={settings.seo_title_en || ''}
          onChangeAr={(val) => handleChange('seo_title_ar', val)}
          onChangeEn={(val) => handleChange('seo_title_en', val)}
        />

        <BilingualField
          label="الوصف الافتراضي (SEO Meta Description)"
          nameAr="seo_description_ar"
          nameEn="seo_description_en"
          valueAr={settings.seo_description_ar || ''}
          valueEn={settings.seo_description_en || ''}
          onChangeAr={(val) => handleChange('seo_description_ar', val)}
          onChangeEn={(val) => handleChange('seo_description_en', val)}
          isTextarea
          rows={3}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ImageUploader
            label="صورة المشاركة الافتراضية (OG Image)"
            value={ogImageUrl}
            onChange={(url) => {
              setOgImageUrl(url);
              setIsDirty(true);
            }}
            folder="seo"
            description="صورة بنسبة 1200x630 تظهر عند مشاركة رابط الموقع"
          />

          <div>
            <label className="block text-sm font-semibold text-typography-primary">
              معرّف التحليلات (Plausible / Analytics ID)
            </label>
            <input
              type="text"
              value={settings.analytics_id || ''}
              onChange={(e) => handleChange('analytics_id', e.target.value)}
              placeholder="e.g. hader.ye"
              className="mt-2 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
              dir="ltr"
            />
            <p className="mt-1 text-xs text-typography-muted">
              نطاق التحليلات الآمن والمحترم لخصوصية الزوار
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};
