'use client';

import React, { useState } from 'react';
import { Service } from '@/lib/data/types';
import {
  saveServiceAction,
  toggleServiceVisibilityAction,
  reorderServicesAction,
  deleteServiceAction,
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
  Globe,
  MessageSquareShare,
  MapPin,
  Shield,
  Zap,
} from 'lucide-react';

interface ServicesClientProps {
  initialServices: Service[];
}

export const ServicesClient: React.FC<ServicesClientProps> = ({ initialServices }) => {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Service>>({
    slug: '',
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    icon: 'Globe',
    sort_order: services.length + 1,
    is_visible: true,
  });

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      slug: '',
      title_ar: '',
      title_en: '',
      description_ar: '',
      description_en: '',
      icon: 'Globe',
      sort_order: services.length + 1,
      is_visible: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    setFormData(svc);
    setModalOpen(true);
  };

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    if (editingService?.id) data.append('id', editingService.id);
    data.append('slug', formData.slug || '');
    data.append('title_ar', formData.title_ar || '');
    data.append('title_en', formData.title_en || '');
    data.append('description_ar', formData.description_ar || '');
    data.append('description_en', formData.description_en || '');
    data.append('icon', formData.icon || 'Globe');
    data.append('sort_order', String(formData.sort_order || 0));
    data.append('is_visible', String(formData.is_visible ?? true));

    const res = await saveServiceAction(null, data);
    if (res.success) {
      showToast('تم حفظ الخدمة بنجاح وتحديث الموقع العام', 'success');
      setModalOpen(false);
      window.location.reload();
    } else {
      showToast(res.error || 'فشل حفظ الخدمة', 'error');
    }
    setLoading(false);
  }

  async function handleToggleVisibility(svc: Service) {
    const nextState = !svc.is_visible;
    const res = await toggleServiceVisibilityAction(svc.id, nextState);
    if (res.success) {
      showToast(`تم ${nextState ? 'إظهار' : 'إخفاء'} الخدمة على الموقع العام`, 'success');
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, is_visible: nextState } : s))
      );
    } else {
      showToast(res.error || 'فشل تعديل حالة الظهور', 'error');
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newServices = [...services];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newServices.length) return;

    const temp = newServices[index];
    newServices[index] = newServices[targetIndex];
    newServices[targetIndex] = temp;

    setServices(newServices);
    const orderedIds = newServices.map((s) => s.id);
    const res = await reorderServicesAction(orderedIds);
    if (res.success) {
      showToast('تم حفظ الترتيب الجديد', 'success');
    } else {
      showToast('فشل حفظ الترتيب', 'error');
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const res = await deleteServiceAction(deleteTarget.id);
    if (res.success) {
      showToast('تم حذف الخدمة بنجاح', 'success');
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      showToast(res.error || 'فشل حذف الخدمة', 'error');
    }
    setDeleteLoading(false);
  }

  const columns: Column<Service>[] = [
    {
      header: 'الترتيب',
      cell: (row) => {
        const index = services.findIndex((s) => s.id === row.id);
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
                title="تحريك لأعلى"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={index === services.length - 1}
                onClick={() => handleMove(index, 'down')}
                className="p-0.5 text-typography-muted hover:text-brand-accent disabled:opacity-30"
                title="تحريك لأسفل"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: 'الخدمة (AR / EN)',
      cell: (row) => (
        <div>
          <div className="font-bold text-typography-primary">{row.title_ar}</div>
          <div className="text-xs text-typography-muted">{row.title_en}</div>
        </div>
      ),
    },
    {
      header: 'المعرف (Slug)',
      accessorKey: 'slug',
      className: 'font-mono text-xs text-typography-muted',
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
            title="تعديل الخدمة"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-status-error hover:bg-status-error/10"
            title="حذف الخدمة"
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
            إدارة الخدمات الأساسية
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            إضافة وتعديل الخدمات المعروضة على الصفحة الرئيسية وتغيير ترتيبها وحالة ظهورها
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-foreground shadow-sm hover:bg-brand-primary-hover"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة خدمة جديدة</span>
        </button>
      </div>

      {/* Services Table */}
      <DataTable
        data={services}
        columns={columns}
        searchKey="title_ar"
        searchPlaceholder="بحث في الخدمات..."
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-subtle bg-surface-elevated p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-typography-primary">
              {editingService ? 'تعديل تفاصيل الخدمة' : 'إضافة خدمة جديدة'}
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
                  placeholder="e.g. websites"
                  className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2 text-sm font-mono text-typography-primary focus:border-brand-accent focus:outline-none"
                  dir="ltr"
                />
              </div>

              <BilingualField
                label="عنوان الخدمة"
                nameAr="title_ar"
                nameEn="title_en"
                valueAr={formData.title_ar}
                valueEn={formData.title_en}
                onChangeAr={(val) => setFormData((p) => ({ ...p, title_ar: val }))}
                onChangeEn={(val) => setFormData((p) => ({ ...p, title_en: val }))}
                required
              />

              <BilingualField
                label="وصف الخدمة"
                nameAr="description_ar"
                nameEn="description_en"
                valueAr={formData.description_ar}
                valueEn={formData.description_en}
                onChangeAr={(val) => setFormData((p) => ({ ...p, description_ar: val }))}
                onChangeEn={(val) => setFormData((p) => ({ ...p, description_en: val }))}
                isTextarea
                rows={3}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-typography-primary">الأيقونة</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                  >
                    <option value="Globe">Globe (موقع إلكتروني)</option>
                    <option value="MessageSquareShare">MessageSquareShare (أتمتة الردود)</option>
                    <option value="MapPin">MapPin (خرائط وتواجد محلي)</option>
                    <option value="Shield">Shield (أمان وموثوقية)</option>
                    <option value="Zap">Zap (سرعة وكفاءة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-typography-primary">الترتيب</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData((p) => ({ ...p, sort_order: parseInt(e.target.value, 10) || 0 }))}
                    className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_visible_check"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData((p) => ({ ...p, is_visible: e.target.checked }))}
                  className="rounded border-border-strong text-brand-primary focus:ring-brand-accent"
                />
                <label htmlFor="is_visible_check" className="text-sm font-medium text-typography-primary">
                  نشر الخدمة وظهورها على الموقع العام
                </label>
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
                  {loading ? 'جاري الحفظ...' : 'حفظ الخدمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="حذف الخدمة"
        message={`هل أنت متأكد من رغبتك في حذف خدمة "${deleteTarget?.title_ar}" نهائياً من قاعدة البيانات؟`}
        confirmLabel="تأكيد الحذف"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
