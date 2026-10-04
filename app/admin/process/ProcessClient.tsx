'use client';

import React, { useState } from 'react';
import { ProcessStep } from '@/lib/data/types';
import {
  saveProcessStepAction,
  toggleProcessStepVisibilityAction,
  reorderProcessStepsAction,
  deleteProcessStepAction,
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
  ListOrdered,
  X,
} from 'lucide-react';

interface ProcessClientProps {
  initialSteps: ProcessStep[];
}

export const ProcessClient: React.FC<ProcessClientProps> = ({ initialSteps }) => {
  const { showToast } = useToast();
  const [steps, setSteps] = useState<ProcessStep[]>(initialSteps);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [loading, setLoading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ProcessStep | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [stepNumber, setStepNumber] = useState<number>(1);
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const openCreateModal = () => {
    setEditingStep(null);
    setStepNumber(steps.length + 1);
    setTitleAr('');
    setTitleEn('');
    setDescriptionAr('');
    setDescriptionEn('');
    setIsVisible(true);
    setModalOpen(true);
  };

  const openEditModal = (step: ProcessStep) => {
    setEditingStep(step);
    setStepNumber(step.step_number);
    setTitleAr(step.title_ar || '');
    setTitleEn(step.title_en || '');
    setDescriptionAr(step.description_ar || '');
    setDescriptionEn(step.description_en || '');
    setIsVisible(step.is_visible);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim() && !titleEn.trim()) {
      showToast('يجب إدخال عنوان الخطوة بلغة واحدة على الأقل', 'error');
      return;
    }
    if (!descriptionAr.trim() && !descriptionEn.trim()) {
      showToast('يجب إدخال وصف الخطوة بلغة واحدة على الأقل', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (editingStep) {
      formData.set('id', editingStep.id);
      formData.set('sort_order', editingStep.sort_order.toString());
    } else {
      formData.set('sort_order', steps.length.toString());
    }

    formData.set('step_number', stepNumber.toString());
    formData.set('title_ar', titleAr);
    formData.set('title_en', titleEn);
    formData.set('description_ar', descriptionAr);
    formData.set('description_en', descriptionEn);
    formData.set('is_visible', isVisible ? 'true' : 'false');

    const result = await saveProcessStepAction(null, formData);
    setLoading(false);

    if (result.success) {
      showToast(editingStep ? 'تم تحديث الخطوة بنجاح' : 'تم إضافة الخطوة بنجاح', 'success');
      setModalOpen(false);

      if (editingStep) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === editingStep.id
              ? {
                  ...s,
                  step_number: stepNumber,
                  title_ar: titleAr,
                  title_en: titleEn,
                  description_ar: descriptionAr,
                  description_en: descriptionEn,
                  is_visible: isVisible,
                }
              : s
          )
        );
      } else {
        const dummyNew: ProcessStep = {
          id: 'temp-' + Date.now(),
          step_number: stepNumber,
          title_ar: titleAr,
          title_en: titleEn,
          description_ar: descriptionAr,
          description_en: descriptionEn,
          sort_order: steps.length,
          is_visible: isVisible,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSteps((prev) => [...prev, dummyNew]);
      }
    } else {
      showToast(result.error || 'حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleToggleVisibility = async (step: ProcessStep) => {
    const newStatus = !step.is_visible;
    const result = await toggleProcessStepVisibilityAction(step.id, newStatus);
    if (result.success) {
      showToast(newStatus ? 'أصبحت الخطوة مرئية' : 'تم إخفاء الخطوة', 'success');
      setSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, is_visible: newStatus } : s))
      );
    } else {
      showToast(result.error || 'فشل تحديث الحالة', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    // update step numbers
    newSteps.forEach((s, idx) => {
      s.step_number = idx + 1;
      s.sort_order = idx;
    });

    setSteps(newSteps);
    const orderedIds = newSteps.map((s) => s.id);
    const result = await reorderProcessStepsAction(orderedIds);
    if (result.success) {
      showToast('تم تحديث ترتيب الخطوات', 'success');
    } else {
      showToast(result.error || 'فشل حفظ الترتيب الجديد', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const result = await deleteProcessStepAction(deleteTarget.id);
    setDeleteLoading(false);

    if (result.success) {
      showToast('تم حذف الخطوة بنجاح', 'success');
      setSteps((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      showToast(result.error || 'حدث خطأ أثناء الحذف', 'error');
    }
  };

  const columns: Column<ProcessStep>[] = [
    {
      key: 'sort',
      header: 'الترتيب',
      className: 'w-24 text-center',
      render: (step, index) => (
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
            disabled={index === steps.length - 1}
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
      key: 'step_number',
      header: 'الرقم',
      className: 'w-16 text-center',
      render: (step) => (
        <div className="flex items-center justify-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-elevated text-xs font-mono font-bold text-brand-accent border border-border-subtle">
            {step.step_number}
          </span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'عنوان الخطوة (AR / EN)',
      render: (step) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-typography-primary">
              {step.title_ar || <span className="text-amber-500 font-normal text-xs">(لا يوجد نص عربي)</span>}
            </span>
            {(!step.title_ar || !step.title_en) && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                لغة واحدة فقط
              </span>
            )}
          </div>
          <div className="text-xs text-typography-muted dir-ltr text-end">
            {step.title_en || <span className="text-amber-500/80">(No English title)</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'وصف الخطوة',
      render: (step) => (
        <p className="text-xs text-typography-secondary line-clamp-2 max-w-sm">
          {step.title_ar ? step.description_ar : step.description_en}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      className: 'w-28 text-center',
      render: (step) => (
        <button
          type="button"
          onClick={() => handleToggleVisibility(step)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            step.is_visible
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20'
          }`}
        >
          {step.is_visible ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>منشور</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>مخفي</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'w-24 text-center',
      render: (step) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(step)}
            className="p-1.5 rounded-lg text-typography-muted hover:text-typography-primary hover:bg-surface-elevated transition-colors"
            title="تعديل الخطوة"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(step)}
            className="p-1.5 rounded-lg text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="حذف الخطوة"
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
            إدارة خطوات العمل (Process Steps)
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            إضافة وتعديل وترتيب خطوات رحلة العميل مع حاضر
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-surface-canvas font-bold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-brand-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة خطوة جديدة</span>
        </button>
      </div>

      <DataTable
        data={steps}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="لم يتم إضافة أي خطوات عمل بعد."
      />

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2 text-typography-primary">
                <ListOrdered className="w-5 h-5 text-brand-accent" />
                <h3 className="text-lg font-bold">
                  {editingStep ? 'تعديل خطوة العمل' : 'إضافة خطوة عمل جديدة'}
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
                  رقم الخطوة التسلسلي
                </label>
                <input
                  type="number"
                  min="1"
                  value={stepNumber}
                  onChange={(e) => setStepNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-32 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                />
              </div>

              <BilingualField
                label="عنوان الخطوة (Step Title)"
                valueAr={titleAr}
                valueEn={titleEn}
                onChangeAr={setTitleAr}
                onChangeEn={setTitleEn}
                placeholderAr="مثال: الاستكشاف والفهم"
                placeholderEn="e.g. Discovery & Alignment"
                required
              />

              <BilingualField
                label="وصف الخطوة (Step Description)"
                valueAr={descriptionAr}
                valueEn={descriptionEn}
                onChangeAr={setDescriptionAr}
                onChangeEn={setDescriptionEn}
                isTextarea
                rows={3}
                placeholderAr="شرح موجز لما يتم إنجازه في هذه الخطوة..."
                placeholderEn="Brief explanation of what is achieved in this step..."
                required
              />

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="step_is_visible"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="h-4 w-4 rounded border-border-subtle bg-surface-elevated text-brand-accent focus:ring-brand-accent"
                />
                <label htmlFor="step_is_visible" className="text-sm font-medium text-typography-primary cursor-pointer">
                  نشر الخطوة وظهورها على الموقع العام مباشرة
                </label>
              </div>

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
                  {loading ? 'جاري الحفظ...' : editingStep ? 'حفظ التعديلات' : 'إضافة الخطوة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="تأكيد حذف خطوة العمل"
        message={`هل أنت متأكد من رغبتك في حذف الخطوة رقم (${deleteTarget?.step_number})؟`}
        confirmLabel={deleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
