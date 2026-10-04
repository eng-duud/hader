'use client';

import React, { useState } from 'react';
import { ClientCategory } from '@/lib/data/types';
import {
  saveCategoryAction,
  reorderCategoriesAction,
  deleteCategoryAction,
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
  FolderTree,
  X,
} from 'lucide-react';

interface CategoriesClientProps {
  initialCategories: ClientCategory[];
}

export const CategoriesClient: React.FC<CategoriesClientProps> = ({ initialCategories }) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<ClientCategory[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ClientCategory | null>(null);
  const [loading, setLoading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ClientCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [slug, setSlug] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');

  const openCreateModal = () => {
    setEditingCategory(null);
    setSlug('');
    setNameAr('');
    setNameEn('');
    setModalOpen(true);
  };

  const openEditModal = (category: ClientCategory) => {
    setEditingCategory(category);
    setSlug(category.slug);
    setNameAr(category.name_ar || '');
    setNameEn(category.name_en || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) {
      showToast('المعرف اللطيف (Slug) مطلوب', 'error');
      return;
    }
    if (!nameAr.trim() && !nameEn.trim()) {
      showToast('يجب إدخال اسم التصنيف بلغة واحدة على الأقل', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (editingCategory) {
      formData.set('id', editingCategory.id);
      formData.set('sort_order', editingCategory.sort_order.toString());
    } else {
      formData.set('sort_order', categories.length.toString());
    }

    formData.set('slug', slug);
    formData.set('name_ar', nameAr);
    formData.set('name_en', nameEn);

    const result = await saveCategoryAction(null, formData);
    setLoading(false);

    if (result.success) {
      showToast(editingCategory ? 'تم تحديث التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح', 'success');
      setModalOpen(false);

      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? {
                  ...c,
                  slug,
                  name_ar: nameAr,
                  name_en: nameEn,
                }
              : c
          )
        );
      } else {
        const dummyNew: ClientCategory = {
          id: 'temp-' + Date.now(),
          slug,
          name_ar: nameAr,
          name_en: nameEn,
          sort_order: categories.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, dummyNew]);
      }
    } else {
      showToast(result.error || 'حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    newCategories.forEach((c, idx) => {
      c.sort_order = idx;
    });

    setCategories(newCategories);
    const orderedIds = newCategories.map((c) => c.id);
    const result = await reorderCategoriesAction(orderedIds);
    if (result.success) {
      showToast('تم تحديث ترتيب التصنيفات', 'success');
    } else {
      showToast(result.error || 'فشل حفظ الترتيب الجديد', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const result = await deleteCategoryAction(deleteTarget.id);
    setDeleteLoading(false);

    if (result.success) {
      showToast('تم حذف التصنيف بنجاح', 'success');
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      showToast(result.error || 'حدث خطأ أثناء الحذف', 'error');
    }
  };

  const columns: Column<ClientCategory>[] = [
    {
      key: 'sort',
      header: 'الترتيب',
      className: 'w-24 text-center',
      render: (cat, index) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => handleMove(index, 'up')}
            className="p-1 rounded text-typography-muted hover:text-typography-primary hover:bg-surface-elevated disabled:opacity-30 disabled:hover:bg-transparent"
            title="تحريك لأعلى"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={index === categories.length - 1}
            onClick={() => handleMove(index, 'down')}
            className="p-1 rounded text-typography-muted hover:text-typography-primary hover:bg-surface-elevated disabled:opacity-30 disabled:hover:bg-transparent"
            title="تحريك لأسفل"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'اسم التصنيف (AR / EN)',
      render: (cat) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-typography-primary">
              {cat.name_ar || <span className="text-amber-500 font-normal text-xs">(لا يوجد نص عربي)</span>}
            </span>
            {(!cat.name_ar || !cat.name_en) && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                لغة واحدة فقط
              </span>
            )}
          </div>
          <div className="text-xs text-typography-muted dir-ltr text-end">
            {cat.name_en || <span className="text-amber-500/80">(No English name)</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'المعرف اللطيف (Slug)',
      render: (cat) => (
        <span className="inline-flex font-mono text-xs rounded px-2 py-0.5 bg-surface-elevated text-brand-accent border border-border-subtle">
          {cat.slug}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'w-24 text-center',
      render: (cat) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(cat)}
            className="p-1.5 rounded-lg text-typography-muted hover:text-typography-primary hover:bg-surface-elevated transition-colors"
            title="تعديل التصنيف"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(cat)}
            className="p-1.5 rounded-lg text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="حذف التصنيف"
          >
            <Trash2 className="w-4 h-4" />
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
            تصنيفات العملاء والأعمال (Client Categories)
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            إدارة تصنيفات قطاعات الأعمال (مثل: المقاهي والمطاعم، الخدمات الطبية، التجزئة) لفلترة معرض الأعمال
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-surface-canvas font-bold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-brand-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة تصنيف جديد</span>
        </button>
      </div>

      <DataTable
        data={categories}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="لم يتم إضافة أي تصنيفات عملاء بعد."
      />

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2 text-typography-primary">
                <FolderTree className="w-5 h-5 text-brand-accent" />
                <h3 className="text-lg font-bold">
                  {editingCategory ? 'تعديل تصنيف عملاء' : 'إضافة تصنيف عملاء جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-typography-muted hover:text-typography-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-typography-secondary mb-1.5">
                  المعرف اللطيف (Slug)
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. cafes-restaurants"
                  className="w-full font-mono text-sm rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
                <span className="text-[11px] text-typography-muted">
                  أحرف إنجليزية صغيرة وشرطات فقط
                </span>
              </div>

              <BilingualField
                label="اسم التصنيف (Category Name)"
                valueAr={nameAr}
                valueEn={nameEn}
                onChangeAr={setNameAr}
                onChangeEn={setNameEn}
                placeholderAr="مثال: المقاهي والمطاعم"
                placeholderEn="e.g. Cafes & Restaurants"
                required
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-typography-secondary text-sm font-medium hover:bg-surface-elevated transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-brand-accent text-surface-canvas text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingCategory ? 'حفظ التعديلات' : 'إضافة التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="تأكيد حذف تصنيف العملاء"
        message={`هل أنت متأكد من رغبتك في حذف التصنيف "${deleteTarget?.name_ar || deleteTarget?.name_en}"؟`}
        confirmLabel={deleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
