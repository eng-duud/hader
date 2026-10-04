'use client';

import React, { useState } from 'react';
import { Package } from '@/lib/data/types';
import {
  savePackageAction,
  togglePackageVisibilityAction,
  reorderPackagesAction,
  deletePackageAction,
} from './actions';
import { DataTable, Column } from '@/components/admin/DataTable';
import { BilingualField } from '@/components/admin/BilingualField';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  X,
} from 'lucide-react';

interface PackagesClientProps {
  initialPackages: Package[];
}

export const PackagesClient: React.FC<PackagesClientProps> = ({ initialPackages }) => {
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Package>>({
    slug: '',
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    price_cents: null,
    currency: 'YER',
    is_highlighted: false,
    is_visible: true,
    sort_order: packages.length + 1,
    features_ar: [],
    features_en: [],
  });

  // Feature builder state
  const [newFeatureAr, setNewFeatureAr] = useState('');
  const [newFeatureEn, setNewFeatureEn] = useState('');

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      slug: '',
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      price_cents: null,
      currency: 'YER',
      is_highlighted: false,
      is_visible: true,
      sort_order: packages.length + 1,
      features_ar: [],
      features_en: [],
    });
    setNewFeatureAr('');
    setNewFeatureEn('');
    setModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData(pkg);
    setNewFeatureAr('');
    setNewFeatureEn('');
    setModalOpen(true);
  };

  const addFeature = () => {
    if (!newFeatureAr.trim() && !newFeatureEn.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features_ar: [...(prev.features_ar || []), newFeatureAr.trim() || newFeatureEn.trim()],
      features_en: [...(prev.features_en || []), newFeatureEn.trim() || newFeatureAr.trim()],
    }));
    setNewFeatureAr('');
    setNewFeatureEn('');
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features_ar: prev.features_ar?.filter((_, i) => i !== index),
      features_en: prev.features_en?.filter((_, i) => i !== index),
    }));
  };

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    if (editingPackage?.id) data.append('id', editingPackage.id);
    data.append('slug', formData.slug || '');
    data.append('name_ar', formData.name_ar || '');
    data.append('name_en', formData.name_en || '');
    data.append('description_ar', formData.description_ar || '');
    data.append('description_en', formData.description_en || '');
    if (formData.price_cents !== null && formData.price_cents !== undefined) {
      data.append('price_cents', String(formData.price_cents));
    }
    data.append('currency', formData.currency || 'YER');
    data.append('is_highlighted', String(formData.is_highlighted ?? false));
    data.append('is_visible', String(formData.is_visible ?? true));
    data.append('sort_order', String(formData.sort_order || 0));
    data.append('features_ar', JSON.stringify(formData.features_ar || []));
    data.append('features_en', JSON.stringify(formData.features_en || []));

    const res = await savePackageAction(null, data);
    if (res.success) {
      showToast('تم حفظ الباقة بنجاح وتحديث الموقع العام', 'success');
      setModalOpen(false);
      window.location.reload();
    } else {
      showToast(res.error || 'فشل حفظ الباقة', 'error');
    }
    setLoading(false);
  }

  async function handleToggleVisibility(pkg: Package) {
    const nextState = !pkg.is_visible;
    const res = await togglePackageVisibilityAction(pkg.id, nextState);
    if (res.success) {
      showToast(`تم ${nextState ? 'إظهار' : 'إخفاء'} الباقة على الموقع العام`, 'success');
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, is_visible: nextState } : p))
      );
    } else {
      showToast(res.error || 'فشل تعديل حالة الظهور', 'error');
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newPackages = [...packages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPackages.length) return;

    const temp = newPackages[index];
    newPackages[index] = newPackages[targetIndex];
    newPackages[targetIndex] = temp;

    setPackages(newPackages);
    const orderedIds = newPackages.map((p) => p.id);
    const res = await reorderPackagesAction(orderedIds);
    if (res.success) {
      showToast('تم حفظ ترتيب الباقات', 'success');
    } else {
      showToast('فشل حفظ الترتيب', 'error');
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const res = await deletePackageAction(deleteTarget.id);
    if (res.success) {
      showToast('تم حذف الباقة بنجاح', 'success');
      setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      showToast(res.error || 'فشل حذف الباقة', 'error');
    }
    setDeleteLoading(false);
  }

  const columns: Column<Package>[] = [
    {
      header: 'الترتيب',
      cell: (row) => {
        const index = packages.findIndex((p) => p.id === row.id);
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold text-typography-muted w-5">
              {row.sort_order}
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => handleMove(index, 'up')}
                className="p-0.5 text-typography-muted hover:text-brand-accent disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={index === packages.length - 1}
                onClick={() => handleMove(index, 'down')}
                className="p-0.5 text-typography-muted hover:text-brand-accent disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: 'اسم الباقة',
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-typography-primary">{row.name_ar}</span>
            {row.is_highlighted && (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-accent">
                <Sparkles className="h-3 w-3" />
                <span>مميزة</span>
              </span>
            )}
          </div>
          <div className="text-xs text-typography-muted">{row.name_en}</div>
        </div>
      ),
    },
    {
      header: 'السعر المعروض',
      cell: (row) => (
        <span className="text-xs font-semibold text-typography-primary">
          {row.price_cents ? `${row.price_cents} ${row.currency}` : 'تواصل معنا (اتصال/عرض سعر)'}
        </span>
      ),
    },
    {
      header: 'المميزات',
      cell: (row) => (
        <span className="text-xs text-typography-muted">
          {row.features_ar?.length || 0} مميزات
        </span>
      ),
    },
    {
      header: 'الحالة',
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleToggleVisibility(row)}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            row.is_visible
              ? 'bg-status-success/15 text-status-success hover:bg-status-success/20'
              : 'bg-surface-sunken text-typography-muted hover:bg-surface-sunken/80'
          }`}
        >
          {row.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span>{row.is_visible ? 'منشور' : 'مخفي'}</span>
        </button>
      ),
    },
    {
      header: 'إجراءات',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-typography-muted hover:bg-surface-sunken hover:text-typography-primary"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-status-error hover:bg-status-error/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-typography-primary">
            إدارة الباقات والخطط
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            تعديل خطط وباقات العمل والأسعار وقائمة المميزات لكل باقة
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-foreground shadow-sm hover:bg-brand-primary-hover"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة باقة جديدة</span>
        </button>
      </div>

      <DataTable
        data={packages}
        columns={columns}
        searchKey="name_ar"
        searchPlaceholder="بحث في الباقات..."
      />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-typography-primary">
              {editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </h2>

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-typography-primary">
                  المعرف الفريد (Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value.toLowerCase() }))}
                  placeholder="e.g. starter-presence"
                  className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2 text-sm font-mono text-typography-primary focus:border-brand-accent focus:outline-none"
                  dir="ltr"
                />
              </div>

              <BilingualField
                label="اسم الباقة"
                nameAr="name_ar"
                nameEn="name_en"
                valueAr={formData.name_ar}
                valueEn={formData.name_en}
                onChangeAr={(val) => setFormData((p) => ({ ...p, name_ar: val }))}
                onChangeEn={(val) => setFormData((p) => ({ ...p, name_en: val }))}
                required
              />

              <BilingualField
                label="وصف الباقة"
                nameAr="description_ar"
                nameEn="description_en"
                valueAr={formData.description_ar}
                valueEn={formData.description_en}
                onChangeAr={(val) => setFormData((p) => ({ ...p, description_ar: val }))}
                onChangeEn={(val) => setFormData((p) => ({ ...p, description_en: val }))}
                isTextarea
                rows={2}
                required
              />

              {/* Price & Currency */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-primary">
                    السعر (اتركه فارغاً لعرض "تواصل معنا")
                  </label>
                  <input
                    type="number"
                    value={formData.price_cents ?? ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        price_cents: e.target.value ? parseInt(e.target.value, 10) : null,
                      }))
                    }
                    placeholder="e.g. 50000"
                    className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-typography-primary">العملة</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Feature List Builder */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-typography-primary">
                  مميزات الباقة (Bilingual Features List)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newFeatureAr}
                    onChange={(e) => setNewFeatureAr(e.target.value)}
                    placeholder="ميزة جديدة بالعربية..."
                    className="flex-1 rounded-lg border border-border-strong bg-surface-sunken px-3 py-1.5 text-xs text-typography-primary focus:border-brand-accent focus:outline-none"
                    dir="rtl"
                  />
                  <input
                    type="text"
                    value={newFeatureEn}
                    onChange={(e) => setNewFeatureEn(e.target.value)}
                    placeholder="Feature in English..."
                    className="flex-1 rounded-lg border border-border-strong bg-surface-sunken px-3 py-1.5 text-xs text-typography-primary focus:border-brand-accent focus:outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="rounded-lg bg-surface-sunken border border-border-strong px-3 py-1.5 text-xs font-bold text-typography-primary hover:bg-brand-primary hover:text-brand-primary-foreground"
                  >
                    إضافة
                  </button>
                </div>

                {formData.features_ar && formData.features_ar.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {formData.features_ar.map((featAr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken p-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-accent">{idx + 1}.</span>
                          <span>{featAr}</span>
                          <span className="text-typography-muted text-[11px]">— {formData.features_en?.[idx]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="text-status-error hover:text-status-error/80 p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_highlighted_check"
                    checked={formData.is_highlighted}
                    onChange={(e) => setFormData((p) => ({ ...p, is_highlighted: e.target.checked }))}
                    className="rounded border-border-strong text-brand-primary focus:ring-brand-accent"
                  />
                  <label htmlFor="is_highlighted_check" className="text-sm font-medium text-typography-primary">
                    تمييز الباقة كـ (الأكثر طلباً)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_visible_pkg"
                    checked={formData.is_visible}
                    onChange={(e) => setFormData((p) => ({ ...p, is_visible: e.target.checked }))}
                    className="rounded border-border-strong text-brand-primary focus:ring-brand-accent"
                  />
                  <label htmlFor="is_visible_pkg" className="text-sm font-medium text-typography-primary">
                    نشر الباقة على الموقع العام
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-xs font-semibold text-typography-primary hover:bg-surface-sunken"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-brand-primary px-5 py-2 text-xs font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="حذف الباقة"
        message={`هل أنت متأكد من رغبتك في حذف باقة "${deleteTarget?.name_ar}" نهائياً؟`}
        confirmLabel="تأكيد الحذف"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
