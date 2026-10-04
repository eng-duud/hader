'use client';

import React, { useState } from 'react';
import { FAQ } from '@/lib/data/types';
import {
  saveFaqAction,
  toggleFaqVisibilityAction,
  reorderFaqsAction,
  deleteFaqAction,
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
  HelpCircle,
  X,
} from 'lucide-react';

interface FaqsClientProps {
  initialFaqs: FAQ[];
}

export const FaqsClient: React.FC<FaqsClientProps> = ({ initialFaqs }) => {
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [questionAr, setQuestionAr] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [answerAr, setAnswerAr] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const openCreateModal = () => {
    setEditingFaq(null);
    setQuestionAr('');
    setQuestionEn('');
    setAnswerAr('');
    setAnswerEn('');
    setIsVisible(true);
    setModalOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq);
    setQuestionAr(faq.question_ar || '');
    setQuestionEn(faq.question_en || '');
    setAnswerAr(faq.answer_ar || '');
    setAnswerEn(faq.answer_en || '');
    setIsVisible(faq.is_visible);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionAr.trim() && !questionEn.trim()) {
      showToast('يجب إدخال نص السؤال بلغة واحدة على الأقل', 'error');
      return;
    }
    if (!answerAr.trim() && !answerEn.trim()) {
      showToast('يجب إدخال نص الإجابة بلغة واحدة على الأقل', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (editingFaq) {
      formData.set('id', editingFaq.id);
      formData.set('sort_order', editingFaq.sort_order.toString());
    } else {
      formData.set('sort_order', faqs.length.toString());
    }

    formData.set('question_ar', questionAr);
    formData.set('question_en', questionEn);
    formData.set('answer_ar', answerAr);
    formData.set('answer_en', answerEn);
    formData.set('is_visible', isVisible ? 'true' : 'false');

    const result = await saveFaqAction(null, formData);
    setLoading(false);

    if (result.success) {
      showToast(editingFaq ? 'تم تحديث السؤال بنجاح' : 'تم إضافة السؤال بنجاح', 'success');
      setModalOpen(false);

      if (editingFaq) {
        setFaqs((prev) =>
          prev.map((f) =>
            f.id === editingFaq.id
              ? {
                  ...f,
                  question_ar: questionAr,
                  question_en: questionEn,
                  answer_ar: answerAr,
                  answer_en: answerEn,
                  is_visible: isVisible,
                }
              : f
          )
        );
      } else {
        const dummyNew: FAQ = {
          id: 'temp-' + Date.now(),
          question_ar: questionAr,
          question_en: questionEn,
          answer_ar: answerAr,
          answer_en: answerEn,
          sort_order: faqs.length,
          is_visible: isVisible,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setFaqs((prev) => [...prev, dummyNew]);
      }
    } else {
      showToast(result.error || 'حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleToggleVisibility = async (faq: FAQ) => {
    const newStatus = !faq.is_visible;
    const result = await toggleFaqVisibilityAction(faq.id, newStatus);
    if (result.success) {
      showToast(newStatus ? 'أصبح السؤال مرئياً' : 'تم إخفاء السؤال', 'success');
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, is_visible: newStatus } : f))
      );
    } else {
      showToast(result.error || 'فشل تحديث الحالة', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    const temp = newFaqs[index];
    newFaqs[index] = newFaqs[targetIndex];
    newFaqs[targetIndex] = temp;

    setFaqs(newFaqs);
    const orderedIds = newFaqs.map((f) => f.id);
    const result = await reorderFaqsAction(orderedIds);
    if (result.success) {
      showToast('تم تحديث ترتيب الأسئلة', 'success');
    } else {
      showToast(result.error || 'فشل حفظ الترتيب الجديد', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const result = await deleteFaqAction(deleteTarget.id);
    setDeleteLoading(false);

    if (result.success) {
      showToast('تم حذف السؤال بنجاح', 'success');
      setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      showToast(result.error || 'حدث خطأ أثناء الحذف', 'error');
    }
  };

  const columns: Column<FAQ>[] = [
    {
      key: 'sort',
      header: 'الترتيب',
      className: 'w-24 text-center',
      render: (faq, index) => (
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
            disabled={index === faqs.length - 1}
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
      key: 'question',
      header: 'السؤال الشائع (AR / EN)',
      render: (faq) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-typography-primary">
              {faq.question_ar || <span className="text-amber-500 font-normal text-xs">(لا يوجد نص عربي)</span>}
            </span>
            {(!faq.question_ar || !faq.question_en) && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                لغة واحدة فقط
              </span>
            )}
          </div>
          <div className="text-xs text-typography-muted dir-ltr text-end">
            {faq.question_en || <span className="text-amber-500/80">(No English question)</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'answer',
      header: 'الإجابة المختصرة',
      render: (faq) => (
        <p className="text-xs text-typography-secondary line-clamp-2 max-w-md">
          {faq.question_ar ? faq.answer_ar : faq.answer_en}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      className: 'w-28 text-center',
      render: (faq) => (
        <button
          type="button"
          onClick={() => handleToggleVisibility(faq)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            faq.is_visible
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20'
          }`}
        >
          {faq.is_visible ? (
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
      render: (faq) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(faq)}
            className="p-1.5 rounded-lg text-typography-muted hover:text-typography-primary hover:bg-surface-elevated transition-colors"
            title="تعديل السؤال"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(faq)}
            className="p-1.5 rounded-lg text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="حذف السؤال"
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
            إدارة الأسئلة الشائعة (FAQ)
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            إضافة وإعادة ترتيب الأسئلة المتداولة وإجاباتها باللغتين العربية والإنجليزية
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-surface-canvas font-bold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-brand-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سؤال جديد</span>
        </button>
      </div>

      <DataTable
        data={faqs}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="لم يتم إضافة أي أسئلة شائعة بعد."
      />

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2 text-typography-primary">
                <HelpCircle className="w-5 h-5 text-brand-accent" />
                <h3 className="text-lg font-bold">
                  {editingFaq ? 'تعديل السؤال الشائع' : 'إضافة سؤال شائع جديد'}
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
              <BilingualField
                label="نص السؤال (Question)"
                valueAr={questionAr}
                valueEn={questionEn}
                onChangeAr={setQuestionAr}
                onChangeEn={setQuestionEn}
                placeholderAr="مثال: كيف تبدأ خدمة حاضر في تجهيز الحضور الرقمي؟"
                placeholderEn="e.g. How does Hader start preparing digital presence?"
                required
              />

              <BilingualField
                label="نص الإجابة (Answer)"
                valueAr={answerAr}
                valueEn={answerEn}
                onChangeAr={setAnswerAr}
                onChangeEn={setAnswerEn}
                isTextarea
                rows={4}
                placeholderAr="تفاصيل الإجابة الشاملة بالعربية..."
                placeholderEn="Comprehensive answer details in English..."
                required
              />

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="faq_is_visible"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="h-4 w-4 rounded border-border-subtle bg-surface-elevated text-brand-accent focus:ring-brand-accent"
                />
                <label htmlFor="faq_is_visible" className="text-sm font-medium text-typography-primary cursor-pointer">
                  نشر السؤال وظهوره على الموقع العام مباشرة
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
                  {loading ? 'جاري الحفظ...' : editingFaq ? 'حفظ التعديلات' : 'إضافة السؤال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="تأكيد حذف السؤال الشائع"
        message={`هل أنت متأكد من رغبتك في حذف هذا السؤال؟ لن يظهر مجدداً في قائمة الأسئلة الشائعة بالموقع.`}
        confirmLabel={deleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
