import React from 'react';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { Lead } from '@/lib/data/types';
import {
  Users,
  Briefcase,
  FileEdit,
  Mail,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
} from 'lucide-react';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { profile } = await requireAuth();
  const supabase = createClient();

  // 1. Fetch Real Counts in Parallel
  const [
    { count: newLeadsCount },
    { count: publishedClientsCount },
    { count: draftClientsCount },
    { data: latestLeads },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_published', false),
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const leads = (latestLeads as Lead[]) || [];

  return (
    <div className="space-y-8">
      {/* Forbidden Permission Banner if redirected from restricted section */}
      {searchParams.error === 'forbidden' && (
        <div className="flex items-center gap-3 rounded-xl border border-status-error/30 bg-status-error/10 p-4 text-sm font-medium text-status-error">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>عذراً: هذا القسم مخصص لمالك النظام (Owner) فقط وغير مصرح لحسابك بفتحه.</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-typography-primary">
          مرحباً، {profile.full_name || 'المدير'} 👋
        </h1>
        <p className="mt-1 text-sm text-typography-muted">
          ملخص نشاط المنصة وطلبات العملاء الحالية
        </p>
      </div>

      {/* Real Counts Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1: New Leads */}
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-typography-muted">
              طلبات جديدة (Leads)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
              <Mail className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-typography-primary">
              {newLeadsCount ?? 0}
            </span>
            <span className="text-xs text-typography-muted">بانتظار المتابعة</span>
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline"
            >
              <span>عرض جميع الطلبات</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Published Clients */}
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-typography-muted">
              أعمال منشورة في المعرض
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-success/15 text-status-success">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-typography-primary">
              {publishedClientsCount ?? 0}
            </span>
            <span className="text-xs text-typography-muted">مشروع حي</span>
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <Link
              href="/admin/clients"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline"
            >
              <span>إدارة المشاريع</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        {/* Metric 3: Draft Clients */}
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-typography-muted">
              مسودات غير منشورة
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-sunken text-typography-muted">
              <FileEdit className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-typography-primary">
              {draftClientsCount ?? 0}
            </span>
            <span className="text-xs text-typography-muted">قيد المراجعة</span>
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <Link
              href="/admin/clients"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline"
            >
              <span>مراجعة المسودات</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Leads Table */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-typography-primary">
              آخر طلبات التواصل الواردة
            </h2>
            <p className="text-xs text-typography-muted">
              أحدث استفسارات المنشآت عبر نموذج الاتصال
            </p>
          </div>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
          >
            <span>عرض الكل</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-border-subtle bg-surface-sunken/40 text-xs font-semibold uppercase text-typography-muted">
                <tr>
                  <th className="px-6 py-3 text-start">العميل والمنشأة</th>
                  <th className="px-6 py-3 text-start">الهاتف / البريد</th>
                  <th className="px-6 py-3 text-start">الخدمات المطلوبة</th>
                  <th className="px-6 py-3 text-start">الحالة</th>
                  <th className="px-6 py-3 text-start">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {leads.map((lead) => (
                  <tr key={lead.id} className="transition-colors hover:bg-surface-sunken/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-typography-primary">{lead.name}</div>
                      <div className="text-xs text-typography-muted">{lead.business_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-typography-primary" dir="ltr">
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="text-xs text-typography-muted">{lead.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {lead.interests?.length > 0 ? (
                          lead.interests.map((int, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-typography-primary"
                            >
                              {int}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-typography-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          lead.status === 'new'
                            ? 'bg-brand-accent/15 text-brand-accent'
                            : lead.status === 'contacted'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : lead.status === 'won'
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-surface-sunken text-typography-muted'
                        }`}
                      >
                        {lead.status === 'new' && <Clock className="h-3 w-3" />}
                        {lead.status === 'won' && <CheckCircle2 className="h-3 w-3" />}
                        <span>
                          {lead.status === 'new'
                            ? 'جديد'
                            : lead.status === 'contacted'
                            ? 'تم التواصل'
                            : lead.status === 'won'
                            ? 'تم الاتفاق'
                            : 'مغلق'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-typography-muted">
                      {new Date(lead.created_at).toLocaleDateString('ar-YE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-typography-muted">
            <Inbox className="mx-auto h-8 w-8 text-typography-muted/40" />
            <p className="mt-3 text-sm font-semibold text-typography-primary">
              لا توجد طلبات جديدة حتى الآن
            </p>
            <p className="mt-1 text-xs text-typography-muted">
              ستظهر هنا بيانات العملاء فور إرسالهم نموذج طلب العرض من الموقع العام
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
