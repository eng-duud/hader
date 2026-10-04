'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { Lead } from '@/lib/data/types';
import { updateLeadStatusAction, deleteLeadAction } from './actions';
import {
  Search,
  Download,
  Filter,
  Trash2,
  ExternalLink,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  Building,
  Globe,
  Tag,
  AlertTriangle,
  Loader2,
  Save,
  X,
} from 'lucide-react';

interface LeadsClientProps {
  initialLeads: Lead[];
  userRole: 'owner' | 'editor';
}

const STATUS_LABELS: Record<string, { ar: string; color: string; icon: any }> = {
  new: {
    ar: 'جديد',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: Clock,
  },
  contacted: {
    ar: 'تم التواصل',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    icon: MessageCircle,
  },
  won: {
    ar: 'تم التعاقد',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: CheckCircle2,
  },
  lost: {
    ar: 'ملغي / غير مناسب',
    color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: XCircle,
  },
};

export const LeadsClient: React.FC<LeadsClientProps> = ({ initialLeads, userRole }) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Selected lead for detail modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState<string>('');
  const [leadStatus, setLeadStatus] = useState<'new' | 'contacted' | 'won' | 'lost'>('new');

  // Delete modal state
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: leads.length,
      new: 0,
      contacted: 0,
      won: 0,
      lost: 0,
    };
    for (const lead of leads) {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    }
    return counts;
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (selectedStatus !== 'all' && lead.status !== selectedStatus) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesBusiness = lead.business_name.toLowerCase().includes(q);
        const matchesPhone = lead.phone.includes(q);
        const matchesEmail = lead.email ? lead.email.toLowerCase().includes(q) : false;
        const matchesMsg = lead.message.toLowerCase().includes(q);
        const matchesNotes = lead.notes ? lead.notes.toLowerCase().includes(q) : false;
        return matchesName || matchesBusiness || matchesPhone || matchesEmail || matchesMsg || matchesNotes;
      }
      return true;
    });
  }, [leads, selectedStatus, searchQuery]);

  const handleOpenDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadNotes(lead.notes || '');
    setLeadStatus(lead.status);
    setActionMessage(null);
  };

  const handleSaveLeadDetails = () => {
    if (!selectedLead) return;

    startTransition(async () => {
      const res = await updateLeadStatusAction(selectedLead.id, leadStatus, leadNotes);
      if (res.success) {
        // Update local state
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, status: leadStatus, notes: leadNotes } : l
          )
        );
        setSelectedLead((prev) => (prev ? { ...prev, status: leadStatus, notes: leadNotes } : null));
        setActionMessage({ type: 'success', text: 'تم تحديث بيانات الطلب بنجاح' });
      } else {
        setActionMessage({ type: 'error', text: res.error || 'تعذر تحديث الطلب' });
      }
    });
  };

  const handleDeleteLead = () => {
    if (!leadToDelete) return;

    startTransition(async () => {
      const res = await deleteLeadAction(leadToDelete.id);
      if (res.success) {
        setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
        if (selectedLead?.id === leadToDelete.id) {
          setSelectedLead(null);
        }
        setLeadToDelete(null);
        setActionMessage({ type: 'success', text: 'تم حذف الطلب بنجاح' });
      } else {
        setActionMessage({ type: 'error', text: res.error || 'تعذر حذف الطلب' });
      }
    });
  };

  // CSV Export with UTF-8 BOM for Arabic compatibility in Excel
  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      'المعرف (ID)',
      'تاريخ الإرسال',
      'الحالة',
      'الاسم',
      'اسم المنشأة',
      'الهاتف',
      'البريد الإلكتروني',
      'الخدمات المطلوبة',
      'الرسالة',
      'ملاحظات المتابعة',
      'اللغة',
      'الصفحة المصدر',
    ];

    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.created_at).toLocaleString('ar-YE')}"`,
      `"${STATUS_LABELS[l.status]?.ar || l.status}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.business_name.replace(/"/g, '""')}"`,
      `"${l.phone.replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.interests || []).join('; ').replace(/"/g, '""')}"`,
      `"${l.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(l.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${l.locale}"`,
      `"${l.source_page || '/'}"`,
    ]);

    // Prepend UTF-8 BOM (\uFEFF)
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hader-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-typography-primary">
            إدارة طلبات واستفسارات العملاء (Leads)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-typography-muted">
            متابعة استفسارات المنشآت وتعديل الحالات والملاحظات الداخلية وتصدير السجلات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-2.5 text-xs sm:text-sm font-semibold text-typography-primary hover:border-brand-accent hover:text-brand-accent transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>تصدير إلى Excel / CSV</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs sm:text-sm font-semibold animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="hover:opacity-75"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'كافة الطلبات' },
            { id: 'new', label: 'جديد' },
            { id: 'contacted', label: 'تم التواصل' },
            { id: 'won', label: 'تم التعاقد' },
            { id: 'lost', label: 'ملغي / غير مناسب' },
          ].map((tab) => {
            const isSelected = selectedStatus === tab.id;
            const count = statusCounts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-brand-primary text-brand-primary-foreground shadow-sm'
                    : 'border border-border-subtle bg-surface-elevated text-typography-muted hover:border-brand-accent hover:text-typography-primary'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-sunken text-typography-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-typography-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، المنشأة، الهاتف..."
            className="w-full text-xs sm:text-sm rounded-xl border border-border-subtle bg-surface-elevated ps-10 pe-4 py-2 text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
      </div>

      {/* Leads Table / List */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-elevated/40 p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken text-brand-accent mb-4">
            <Mail className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-typography-primary">
            لا توجد طلبات مطابقة للبحث أو الفلتر
          </h3>
          <p className="mt-1 text-xs text-typography-muted">
            {leads.length === 0
              ? 'لم يتم استلام أي استفسارات عبر الموقع حتى الآن.'
              : 'جرّب تغيير عبارة البحث أو اختيار تصنيف حالة آخر.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-panel overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="border-b border-border-subtle bg-surface-elevated/70 text-typography-muted font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-4 text-start">العميل والمنشأة</th>
                  <th className="p-4 text-start">بيانات التواصل</th>
                  <th className="p-4 text-start">الخدمات المطلوبة</th>
                  <th className="p-4 text-start">الحالة</th>
                  <th className="p-4 text-start">تاريخ الإرسال</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {filteredLeads.map((lead) => {
                  const statusInfo = STATUS_LABELS[lead.status] || STATUS_LABELS.new;
                  const StatusIcon = statusInfo.icon;
                  const cleanPhone = lead.phone.replace(/[^\d]/g, '');
                  const whatsappChatUrl = `https://wa.me/${cleanPhone}`;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-surface-elevated/50 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetail(lead)}
                    >
                      {/* Name & Business */}
                      <td className="p-4">
                        <div className="font-bold text-typography-primary text-sm">
                          {lead.name}
                        </div>
                        <div className="text-xs text-typography-muted mt-0.5 flex items-center gap-1.5">
                          <Building className="h-3 w-3 text-brand-accent shrink-0" />
                          <span>{lead.business_name}</span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span dir="ltr" className="font-mono text-xs font-semibold text-typography-primary">
                            {lead.phone}
                          </span>
                          <a
                            href={whatsappChatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="محادثة واتساب"
                            className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        {lead.email && (
                          <div className="text-xs text-typography-muted mt-1 font-mono">
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-brand-accent transition-colors"
                            >
                              {lead.email}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Services / Interests */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {lead.interests.length > 0 ? (
                            lead.interests.map((svc) => (
                              <span
                                key={svc}
                                className="inline-block rounded-md bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold text-typography-secondary border border-border-subtle"
                              >
                                {svc}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-typography-muted">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo.ar}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs text-typography-muted whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('ar-YE', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(lead)}
                            className="rounded-lg p-2 text-typography-muted hover:bg-surface-elevated hover:text-brand-accent transition-colors"
                            title="عرض التفاصيل"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {userRole === 'owner' && (
                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              className="rounded-lg p-2 text-typography-muted hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                              title="حذف الطلب"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DETAIL MODAL / DRAWER */}
      {/* -------------------------------------------------------------------- */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-border-subtle bg-surface-panel p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary-foreground shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-typography-primary">
                    {/* Rendered strictly as sanitized text node */}
                    {selectedLead.name}
                  </h2>
                  <div className="text-xs text-typography-muted flex items-center gap-1.5 mt-0.5">
                    <Building className="h-3 w-3 text-brand-accent" />
                    <span>{selectedLead.business_name}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="rounded-xl p-2 text-typography-muted hover:bg-surface-elevated hover:text-typography-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Contact & WhatsApp Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-elevated border border-border-subtle text-xs">
              <div className="space-y-1">
                <span className="text-typography-muted">الهاتف / واتساب:</span>
                <div className="flex items-center gap-2">
                  <span dir="ltr" className="font-mono font-bold text-typography-primary text-sm">
                    {selectedLead.phone}
                  </span>
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] text-white font-bold text-[11px] shadow-sm hover:opacity-90"
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span>واتساب</span>
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-typography-muted">البريد الإلكتروني:</span>
                <div className="font-mono text-sm font-semibold text-typography-primary truncate">
                  {selectedLead.email ? (
                    <a href={`mailto:${selectedLead.email}`} className="text-brand-accent hover:underline">
                      {selectedLead.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>

            {/* Requested Services */}
            <div>
              <span className="block text-xs font-bold text-typography-secondary mb-2">
                الخدمات المطلوبة:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedLead.interests.length > 0 ? (
                  selectedLead.interests.map((svc) => (
                    <span
                      key={svc}
                      className="rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-3 py-1 text-xs font-bold"
                    >
                      {svc}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-typography-muted">طلب عام</span>
                )}
              </div>
            </div>

            {/* Message Body (Rendered as Inert Text Node - No HTML execution) */}
            <div>
              <span className="block text-xs font-bold text-typography-secondary mb-2">
                نص الرسالة وتفاصيل الطلب:
              </span>
              <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-xs sm:text-sm text-typography-primary leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {selectedLead.message}
              </div>
            </div>

            {/* Status Selector & Internal Notes */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-typography-secondary mb-1.5">
                    تعديل حالة الطلب:
                  </label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2.5 text-xs sm:text-sm font-semibold text-typography-primary focus:border-brand-accent focus:outline-none"
                  >
                    <option value="new">جديد (New)</option>
                    <option value="contacted">تم التواصل (Contacted)</option>
                    <option value="won">تم التعاقد (Won)</option>
                    <option value="lost">ملغي / غير مناسب (Lost)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-typography-secondary mb-1.5">
                    معلومات التتبع:
                  </label>
                  <div className="text-[11px] text-typography-muted space-y-0.5 font-mono">
                    <div>المصدر: {selectedLead.source_page || '/'}</div>
                    <div>اللغة: {selectedLead.locale}</div>
                    <div>
                      التاريخ:{' '}
                      {new Date(selectedLead.created_at).toLocaleString('ar-YE')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-typography-secondary mb-1.5">
                  ملاحظات المتابعة الداخلية (خاصة بالفريق):
                </label>
                <textarea
                  rows={3}
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="سجل ملاحظات الاتصال، الاتفاقات الأولية، أو سبب الإلغاء..."
                  className="w-full text-xs sm:text-sm rounded-xl border border-border-subtle bg-surface-elevated p-3 text-typography-primary focus:border-brand-accent focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {userRole === 'owner' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLeadToDelete(selectedLead);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>حذف هذا السجل</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveLeadDetails}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-brand-primary-foreground shadow-md hover:bg-brand-primary-hover disabled:opacity-50 transition-colors"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>حفظ التعديلات والملاحظات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* -------------------------------------------------------------------- */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-surface-panel p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-typography-primary">
              تأكيد حذف طلب التواصل
            </h3>

            <p className="text-xs sm:text-sm text-typography-muted leading-relaxed">
              هل أنت متأكد من حذف طلب العميل{' '}
              <strong className="text-typography-primary">{leadToDelete.name}</strong> (منشأة:{' '}
              {leadToDelete.business_name})؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذفه نهائياً من قاعدة البيانات.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setLeadToDelete(null)}
                className="rounded-xl border border-border-subtle px-4 py-2 text-xs font-semibold text-typography-muted hover:bg-surface-elevated transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteLead}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>نعم، حذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
