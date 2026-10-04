'use client';

import React, { useState } from 'react';
import { Profile } from '@/lib/data/types';
import { User } from '@supabase/supabase-js';
import { inviteUserAction, updateUserRoleAction, removeUserAction } from './actions';
import { DataTable, Column } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';
import { UserPlus, Shield, Trash2, KeyRound } from 'lucide-react';

interface UsersClientProps {
  initialProfiles: (Profile & { email?: string })[];
  currentUserId: string;
}

export const UsersClient: React.FC<UsersClientProps> = ({
  initialProfiles,
  currentUserId,
}) => {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);

    const formData = new FormData(e.currentTarget);
    const res = await inviteUserAction(null, formData);

    if (res.success) {
      showToast('تمت إضافة المستخدم بنجاح', 'success');
      setIsInviteOpen(false);
      window.location.reload();
    } else {
      setInviteError(res.error || 'حدث خطأ أثناء دعوة المستخدم');
    }
    setInviteLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: 'owner' | 'editor') {
    const res = await updateUserRoleAction(userId, newRole);
    if (res.success) {
      showToast('تم تحديث صلاحية المستخدم بنجاح', 'success');
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === userId ? { ...p, role: newRole } : p))
      );
    } else {
      showToast(res.error || 'فشل تعديل الصلاحية', 'error');
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const res = await removeUserAction(deleteTarget.user_id);
    if (res.success) {
      showToast('تم حذف المستخدم بنجاح', 'success');
      setProfiles((prev) => prev.filter((p) => p.user_id !== deleteTarget.user_id));
      setDeleteTarget(null);
    } else {
      showToast(res.error || 'فشل حذف المستخدم', 'error');
    }
    setDeleteLoading(false);
  }

  const columns: Column<Profile & { email?: string }>[] = [
    {
      header: 'الاسم والمعرّف',
      cell: (row) => (
        <div>
          <div className="font-semibold text-typography-primary">
            {row.full_name || 'بدون اسم'}
          </div>
          <div className="font-mono text-xs text-typography-muted">
            {row.email || row.user_id.substring(0, 13) + '...'}
          </div>
        </div>
      ),
    },
    {
      header: 'الصلاحية الحالية',
      cell: (row) => (
        <select
          value={row.role}
          disabled={row.user_id === currentUserId}
          onChange={(e) => handleRoleChange(row.user_id, e.target.value as 'owner' | 'editor')}
          className="rounded-lg border border-border-strong bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-typography-primary focus:border-brand-accent focus:outline-none disabled:opacity-60"
        >
          <option value="owner">مالك (Owner) - كافة الصلاحيات</option>
          <option value="editor">محرر (Editor) - إدارة المحتوى فقط</option>
        </select>
      ),
    },
    {
      header: 'تاريخ الإضافة',
      cell: (row) => (
        <span className="text-xs text-typography-muted">
          {new Date(row.created_at).toLocaleDateString('ar-YE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'إجراءات',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.user_id !== currentUserId && (
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="rounded-lg p-1.5 text-status-error hover:bg-status-error/10 transition-colors"
              title="حذف المستخدم"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-typography-primary">
            إدارة المستخدمين والصلاحيات
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            إضافة محرري المحتوى والتحكم في صلاحيات الوصول (مالك النظام فقط)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-foreground shadow-sm hover:bg-brand-primary-hover transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/20 text-brand-accent">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-typography-primary">إضافة عضو جديد للفريق</h3>
                <p className="text-xs text-typography-muted">إنشاء حساب محرر أو مالك لمنصة حاضر</p>
              </div>
            </div>

            {inviteError && (
              <div className="mt-4 rounded-lg bg-status-error/10 p-3 text-xs font-semibold text-status-error">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInvite} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-typography-primary">الاسم الكامل</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="مثال: أحمد محمد"
                  className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-primary">البريد الإلكتروني *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="editor@hader.ye"
                  className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-primary">كلمة المرور المؤقتة *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-typography-primary">نوع الصلاحية *</label>
                <select
                  name="role"
                  defaultValue="editor"
                  className="mt-1 block w-full rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 text-sm text-typography-primary focus:border-brand-accent focus:outline-none"
                >
                  <option value="editor">محرر (Editor) — إدارة المشاريع والخدمات والنصوص</option>
                  <option value="owner">مالك (Owner) — صلاحيات كاملة وإدارة المستخدمين</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-xs font-semibold text-typography-primary hover:bg-surface-sunken"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary-foreground hover:bg-brand-primary-hover disabled:opacity-50"
                >
                  {inviteLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <DataTable
        data={profiles}
        columns={columns}
        searchKey="full_name"
        searchPlaceholder="بحث عن عضو..."
        emptyMessage="لا يوجد مستخدمون مسجلون حالياً"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="حذف حساب مستخدم"
        message={`هل أنت متأكد من رغبتك في حذف حساب "${deleteTarget?.full_name || deleteTarget?.user_id}"؟ لن يتمكن من تسجيل الدخول إلى لوحة الإدارة مجدداً.`}
        confirmLabel="حذف المستخدم نهائياً"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
