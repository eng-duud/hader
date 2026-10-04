'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Client, ClientCategory } from '@/lib/data/types';
import {
  saveClientAction,
  toggleClientFeaturedAction,
  toggleClientPublishedAction,
  reorderClientsAction,
  deleteClientAction,
  bulkDeleteClientsAction,
} from './actions';
import { DataTable, Column } from '@/components/admin/DataTable';
import { BilingualField } from '@/components/admin/BilingualField';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { UnsavedChangesGuard } from '@/components/admin/UnsavedChangesGuard';
import { useToast } from '@/components/admin/Toast';
import { generateClientSlug, validateAndNormalizeUrl } from '@/lib/utils/client-helpers';
import {
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  ExternalLink,
  Star,
  Eye,
  EyeOff,
  Briefcase,
  X,
  Sparkles,
  Layers,
  Globe,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

interface ClientsClientProps {
  initialClients: Client[];
  categories: ClientCategory[];
}

export const ClientsClient: React.FC<ClientsClientProps> = ({
  initialClients,
  categories,
}) => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>(initialClients);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFeatured, setSelectedFeatured] = useState<string>('all');
  const [selectedPublished, setSelectedPublished] = useState<string>('all');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Modal & Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'form' | 'preview'>('form');

  // Form Fields
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Single Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auto-slug sync when name changes and user has not manually customized slug
  useEffect(() => {
    if (!isSlugCustomized && !editingClient) {
      if (nameEn.trim() || nameAr.trim()) {
        const autoSlug = generateClientSlug(nameEn, nameAr);
        setSlug(autoSlug);
      }
    }
  }, [nameEn, nameAr, isSlugCustomized, editingClient]);

  // Track dirty changes
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setNameAr('');
    setNameEn('');
    setSlug('');
    setIsSlugCustomized(false);
    setDescriptionAr('');
    setDescriptionEn('');
    setWebsiteUrl('');
    setLogo('');
    setCoverImage('');
    setCategoryId(categories[0]?.id || '');
    setIsFeatured(false);
    setIsPublished(true);
    setIsDirty(false);
    setPreviewTab('form');
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setNameAr(client.name_ar || '');
    setNameEn(client.name_en || '');
    setSlug(client.slug || '');
    setIsSlugCustomized(true);
    setDescriptionAr(client.description_ar || '');
    setDescriptionEn(client.description_en || '');
    setWebsiteUrl(client.website_url || '');
    setLogo(client.logo || '');
    setCoverImage(client.cover_image || '');
    setCategoryId(client.category_id || '');
    setIsFeatured(client.is_featured);
    setIsPublished(client.is_published);
    setIsDirty(false);
    setPreviewTab('form');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm('لديك تعديلات غير محفوظة. هل أنت متأكد من الإغلاق؟')) {
        setModalOpen(false);
        setIsDirty(false);
      }
    } else {
      setModalOpen(false);
    }
  };

  // Live URL validation check
  const urlStatus = useMemo(() => {
    if (!websiteUrl.trim()) return { isValid: false, error: 'مطلوب' };
    return validateAndNormalizeUrl(websiteUrl);
  }, [websiteUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameAr.trim() && !nameEn.trim()) {
      showToast('يجب إدخال اسم العميل بلغة واحدة على الأقل', 'error');
      return;
    }

    if (!descriptionAr.trim() && !descriptionEn.trim()) {
      showToast('يجب إدخال وصف العميل بلغة واحدة على الأقل', 'error');
      return;
    }

    if (!urlStatus.isValid) {
      showToast(urlStatus.error || 'يرجى إدخال رابط https:// صالح ومكتمل', 'error');
      return;
    }

    if (!logo.trim()) {
      showToast('شعار العميل مطلوب', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (editingClient) {
      formData.set('id', editingClient.id);
      formData.set('sort_order', editingClient.sort_order.toString());
    } else {
      formData.set('sort_order', clients.length.toString());
    }

    formData.set('name_ar', nameAr);
    formData.set('name_en', nameEn);
    formData.set('slug', slug);
    formData.set('description_ar', descriptionAr);
    formData.set('description_en', descriptionEn);
    formData.set('website_url', websiteUrl);
    formData.set('logo', logo);
    formData.set('cover_image', coverImage);
    formData.set('category_id', categoryId);
    formData.set('is_featured', isFeatured ? 'true' : 'false');
    formData.set('is_published', isPublished ? 'true' : 'false');

    const result = await saveClientAction(null, formData);
    setLoading(false);

    if (result.success) {
      showToast(editingClient ? 'تم تحديث بيانات العميل بنجاح' : 'تم إضافة العميل بنجاح', 'success');
      setIsDirty(false);
      setModalOpen(false);

      const matchedCategory = categories.find((c) => c.id === categoryId);

      if (editingClient) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === editingClient.id
              ? {
                  ...c,
                  name_ar: nameAr,
                  name_en: nameEn,
                  slug,
                  description_ar: descriptionAr,
                  description_en: descriptionEn,
                  website_url: websiteUrl,
                  logo,
                  cover_image: coverImage || null,
                  category_id: categoryId || null,
                  category: matchedCategory,
                  is_featured: isFeatured,
                  is_published: isPublished,
                }
              : c
          )
        );
      } else {
        const dummyNew: Client = {
          id: 'temp-' + Date.now(),
          slug,
          name_ar: nameAr,
          name_en: nameEn,
          description_ar: descriptionAr,
          description_en: descriptionEn,
          website_url: websiteUrl,
          logo,
          cover_image: coverImage || null,
          category_id: categoryId || null,
          category: matchedCategory,
          is_featured: isFeatured,
          is_published: isPublished,
          sort_order: clients.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setClients((prev) => [...prev, dummyNew]);
      }
    } else {
      showToast(result.error || 'حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleToggleFeatured = async (client: Client) => {
    const newStatus = !client.is_featured;
    const result = await toggleClientFeaturedAction(client.id, newStatus);
    if (result.success) {
      showToast(newStatus ? 'تم تمييز المشروع في الواجهة' : 'تم إلغاء تمييز المشروع', 'success');
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, is_featured: newStatus } : c))
      );
    } else {
      showToast(result.error || 'فشل تحديث الحالة', 'error');
    }
  };

  const handleTogglePublished = async (client: Client) => {
    const newStatus = !client.is_published;
    const result = await toggleClientPublishedAction(client.id, newStatus);
    if (result.success) {
      showToast(newStatus ? 'أصبح العميل منشوراً للعامة' : 'تم تحويل العميل لمسودة مخفية', 'success');
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, is_published: newStatus } : c))
      );
    } else {
      showToast(result.error || 'فشل تحديث النشر', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= clients.length) return;

    const newClients = [...clients];
    const temp = newClients[index];
    newClients[index] = newClients[targetIndex];
    newClients[targetIndex] = temp;

    newClients.forEach((c, idx) => {
      c.sort_order = idx;
    });

    setClients(newClients);
    const orderedIds = newClients.map((c) => c.id);
    const result = await reorderClientsAction(orderedIds);
    if (result.success) {
      showToast('تم حفظ الترتيب الجديد للمشاريع', 'success');
    } else {
      showToast(result.error || 'فشل حفظ الترتيب', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const result = await deleteClientAction(deleteTarget.id);
    setDeleteLoading(false);

    if (result.success) {
      showToast('تم حذف العميل وصوره بنجاح', 'success');
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      showToast(result.error || 'فشل الحذف', 'error');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);

    const result = await bulkDeleteClientsAction(selectedIds);
    setBulkDeleting(false);

    if (result.success) {
      showToast(`تم حذف ${result.count || selectedIds.length} عميل وصورهم المخزنة بنجاح`, 'success');
      setClients((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } else {
      showToast(result.error || 'فشل الحذف الجماعي', 'error');
    }
  };

  // Filtered List
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          client.name_ar?.toLowerCase().includes(q) ||
          client.name_en?.toLowerCase().includes(q) ||
          client.description_ar?.toLowerCase().includes(q) ||
          client.description_en?.toLowerCase().includes(q) ||
          client.slug?.toLowerCase().includes(q) ||
          client.website_url?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'all') {
        if (client.category_id !== selectedCategory) return false;
      }

      // Featured
      if (selectedFeatured === 'featured' && !client.is_featured) return false;
      if (selectedFeatured === 'not_featured' && client.is_featured) return false;

      // Published
      if (selectedPublished === 'published' && !client.is_published) return false;
      if (selectedPublished === 'draft' && client.is_published) return false;

      return true;
    });
  }, [clients, searchQuery, selectedCategory, selectedFeatured, selectedPublished]);

  const allFilteredSelected =
    filteredClients.length > 0 &&
    filteredClients.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredClients.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredClients.map((c) => c.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const columns: Column<Client>[] = [
    {
      key: 'select',
      header: (
        <button
          type="button"
          onClick={toggleSelectAll}
          className="text-typography-muted hover:text-typography-primary p-1"
          title="تحديد الكل"
        >
          {allFilteredSelected ? (
            <CheckSquare className="w-4 h-4 text-brand-accent" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
      ),
      className: 'w-10 text-center',
      render: (client) => {
        const isSelected = selectedIds.includes(client.id);
        return (
          <button
            type="button"
            onClick={() => toggleSelectRow(client.id)}
            className="text-typography-muted hover:text-typography-primary p-1"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-brand-accent" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        );
      },
    },
    {
      key: 'sort',
      header: 'الترتيب',
      className: 'w-20 text-center',
      render: (client, index) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => handleMove(index, 'up')}
            className="p-1 rounded text-typography-muted hover:text-typography-primary hover:bg-surface-elevated disabled:opacity-20 disabled:hover:bg-transparent"
            title="تحريك لأعلى"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === clients.length - 1}
            onClick={() => handleMove(index, 'down')}
            className="p-1 rounded text-typography-muted hover:text-typography-primary hover:bg-surface-elevated disabled:opacity-20 disabled:hover:bg-transparent"
            title="تحريك لأسفل"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'العميل والشعار',
      render: (client) => (
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated p-1 shadow-sm">
            {client.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logo}
                alt={client.name_ar || client.name_en}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-typography-muted text-xs">
                شعار
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-typography-primary text-sm">
                {client.name_ar || <span className="text-amber-500 font-normal text-xs">(لا يوجد اسم عربي)</span>}
              </span>
              {(!client.name_ar || !client.name_en) && (
                <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  لغة واحدة
                </span>
              )}
            </div>
            <div className="text-xs text-typography-muted dir-ltr text-end">
              {client.name_en || <span className="text-amber-500/70">(No English name)</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'التصنيف',
      render: (client) => (
        <span className="inline-flex items-center rounded-lg bg-surface-elevated px-2.5 py-1 text-xs font-semibold text-typography-secondary border border-border-subtle">
          {client.category?.name_ar || client.category?.name_en || 'غير مصنف'}
        </span>
      ),
    },
    {
      key: 'website',
      header: 'رابط الموقع',
      render: (client) => (
        <a
          href={client.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand-accent hover:underline font-mono"
        >
          <span className="truncate max-w-[150px]">{client.website_url.replace(/^https?:\/\//, '')}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ),
    },
    {
      key: 'is_featured',
      header: 'مميز',
      className: 'w-20 text-center',
      render: (client) => (
        <button
          type="button"
          onClick={() => handleToggleFeatured(client)}
          className={`p-1.5 rounded-lg transition-colors ${
            client.is_featured
              ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
              : 'text-typography-muted hover:text-typography-primary hover:bg-surface-elevated'
          }`}
          title={client.is_featured ? 'مشروع مميز بالرئيسية' : 'تحديد كمميز'}
        >
          <Star className={`w-4 h-4 ${client.is_featured ? 'fill-amber-400' : ''}`} />
        </button>
      ),
    },
    {
      key: 'is_published',
      header: 'الحالة',
      className: 'w-24 text-center',
      render: (client) => (
        <button
          type="button"
          onClick={() => handleTogglePublished(client)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            client.is_published
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20'
          }`}
        >
          {client.is_published ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>منشور</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>مسودة</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'w-24 text-center',
      render: (client) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(client)}
            className="p-1.5 rounded-lg text-typography-muted hover:text-typography-primary hover:bg-surface-elevated transition-colors"
            title="تعديل بيانات العميل"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(client)}
            className="p-1.5 rounded-lg text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="حذف العميل"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <UnsavedChangesGuard isDirty={isDirty} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-typography-primary">
            معرض العملاء والأعمال (Clients Portfolio)
          </h1>
          <p className="mt-1 text-sm text-typography-muted">
            إضافة وإدارة مشاريع العملاء، التحقق من الروابط، وتمييز الأعمال على الصفحة الرئيسية
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-surface-canvas font-bold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-brand-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-border-subtle bg-surface-panel p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-typography-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الرابط، أو المعرف..."
              className="w-full ps-9 pe-3 py-2 rounded-xl border border-border-subtle bg-surface-elevated text-xs text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-border-subtle bg-surface-elevated text-xs text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
              <option value="all">كافة التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar} ({c.name_en})
                </option>
              ))}
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <select
              value={selectedFeatured}
              onChange={(e) => setSelectedFeatured(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-border-subtle bg-surface-elevated text-xs text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
              <option value="all">حالة التمييز (الكل)</option>
              <option value="featured">مميز في الرئيسية فقط</option>
              <option value="not_featured">غير مميز</option>
            </select>
          </div>

          {/* Published Filter */}
          <div>
            <select
              value={selectedPublished}
              onChange={(e) => setSelectedPublished(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-border-subtle bg-surface-elevated text-xs text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
              <option value="all">حالة النشر (الكل)</option>
              <option value="published">منشور للعامة</option>
              <option value="draft">مسودة مخفية</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-brand-accent/10 border border-brand-accent/20 rounded-xl px-4 py-2 animate-fade-in">
            <span className="text-xs font-bold text-typography-primary">
              تم تحديد ({selectedIds.length}) عميل
            </span>
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المحدد</span>
            </button>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <DataTable
        data={filteredClients}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="لم يتم العثور على أي عملاء يطابقون الفلاتر المحددة."
      />

      {/* Create / Edit Drawer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl border border-border-subtle bg-surface-panel shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 bg-surface-panel shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-accent" />
                <h3 className="text-lg font-bold text-typography-primary">
                  {editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد لمعرض الأعمال'}
                </h3>
              </div>

              {/* View Switcher: Form vs Card Preview */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-surface-elevated p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('form')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      previewTab === 'form'
                        ? 'bg-brand-accent text-surface-canvas shadow-sm'
                        : 'text-typography-muted hover:text-typography-primary'
                    }`}
                  >
                    النموذج
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      previewTab === 'preview'
                        ? 'bg-brand-accent text-surface-canvas shadow-sm'
                        : 'text-typography-muted hover:text-typography-primary'
                    }`}
                  >
                    معاينة البطاقة العامة
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-typography-muted hover:text-typography-primary p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {previewTab === 'preview' ? (
                /* Public Card Live Preview */
                <div className="flex flex-col items-center justify-center p-8 bg-surface-canvas rounded-2xl border border-border-subtle">
                  <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-panel overflow-hidden shadow-lg group">
                    {/* Cover or Placeholder */}
                    <div className="relative aspect-video w-full bg-surface-sunken overflow-hidden flex items-center justify-center">
                      {coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverImage}
                          alt={nameAr || nameEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Globe className="w-8 h-8 text-brand-accent/40 mx-auto mb-1" />
                          <span className="text-[11px] text-typography-muted">صورة الغلاف (اختياري)</span>
                        </div>
                      )}
                      {/* Logo Badge Overlay */}
                      <div className="absolute start-4 bottom-3 h-12 w-12 rounded-xl bg-surface-panel/95 p-1.5 shadow-md backdrop-blur-sm border border-border-subtle flex items-center justify-center">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logo}
                            alt="Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] text-typography-muted">الشعار</span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2.5 py-0.5 rounded-full border border-brand-accent/20">
                          {categories.find((c) => c.id === categoryId)?.name_ar || 'تصنيف عام'}
                        </span>
                        {isFeatured && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>مميز</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-typography-primary">
                        {nameAr || nameEn || 'اسم العميل الافتراضي'}
                      </h4>

                      <p className="text-xs text-typography-muted leading-relaxed line-clamp-3">
                        {descriptionAr || descriptionEn || 'وصف موجز للمشروع والنتائج الرقمية التي حققها مع شركة حاضر...'}
                      </p>

                      <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                        <span className="text-xs text-brand-accent font-semibold flex items-center gap-1">
                          <span>زيارة الموقع</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                        <span className="text-[10px] font-mono text-typography-muted">
                          {websiteUrl.replace(/^https?:\/\//, '') || 'example.ye'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-typography-muted mt-4">
                    هذه المعاينة توضح شكل بطاقة العميل في معرض أعمال حاضر العام
                  </p>
                </div>
              ) : (
                /* Form Inputs */
                <form id="client-form" onSubmit={handleSave} className="space-y-6">
                  {/* Row 1: Names AR & EN */}
                  <BilingualField
                    label="اسم العميل أو المنشأة (Client Name)"
                    valueAr={nameAr}
                    valueEn={nameEn}
                    onChangeAr={(val) => {
                      setNameAr(val);
                      markDirty();
                    }}
                    onChangeEn={(val) => {
                      setNameEn(val);
                      markDirty();
                    }}
                    placeholderAr="مثال: مقهى الراقي"
                    placeholderEn="e.g. Al-Raqi Cafe"
                    required
                  />

                  {/* Row 2: Slug and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-typography-secondary">
                          المعرف اللطيف للرابط (Slug)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSlug(generateClientSlug(nameEn, nameAr));
                            setIsSlugCustomized(false);
                            markDirty();
                          }}
                          className="text-[11px] text-brand-accent hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>توليد تلقائي</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                          setIsSlugCustomized(true);
                          markDirty();
                        }}
                        placeholder="al-raqi-cafe"
                        className="w-full font-mono text-sm rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                      <span className="text-[10px] text-typography-muted mt-1 block">
                        مسار الصفحة: hader.ye/clients/<strong>{slug || '...'}</strong>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-typography-secondary mb-1.5">
                        تصنيف قطاع الأعمال
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => {
                          setCategoryId(e.target.value);
                          markDirty();
                        }}
                        className="w-full text-sm rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-typography-primary focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      >
                        <option value="">-- اختر التصنيف المناسب --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_ar} ({c.name_en})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Website URL with Check Link Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-typography-secondary">
                        رابط الموقع الإلكتروني الحقيقي (Website URL)
                      </label>
                      <span className="text-[11px] text-typography-muted">
                        يجب أن يبدأ بـ https:// حصراً
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          required
                          value={websiteUrl}
                          onChange={(e) => {
                            setWebsiteUrl(e.target.value);
                            markDirty();
                          }}
                          placeholder="https://client-domain.ye"
                          className={`w-full font-mono text-sm rounded-xl border px-3 py-2 text-typography-primary focus:outline-none focus:ring-1 ${
                            websiteUrl && !urlStatus.isValid
                              ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-border-subtle bg-surface-elevated focus:border-brand-accent focus:ring-brand-accent'
                          }`}
                        />
                      </div>

                      <a
                        href={urlStatus.isValid && urlStatus.normalizedUrl ? urlStatus.normalizedUrl : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!urlStatus.isValid) {
                            e.preventDefault();
                            showToast('الرابط غير صالح للفتح', 'error');
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                          urlStatus.isValid
                            ? 'bg-surface-elevated text-brand-accent border border-border-subtle hover:bg-surface-sunken'
                            : 'opacity-40 cursor-not-allowed bg-surface-elevated text-typography-muted border border-border-subtle'
                        }`}
                      >
                        <span>فحص الرابط</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {websiteUrl && !urlStatus.isValid && (
                      <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{urlStatus.error}</span>
                      </p>
                    )}
                  </div>

                  {/* Row 4: Descriptions AR/EN with live 280 char counter */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-typography-secondary">
                        الوصف التسويقي والإنجاز (بحد أقصى 280 حرفاً)
                      </label>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className={descriptionAr.length > 280 ? 'text-rose-500 font-bold' : 'text-typography-muted'}>
                          عربي: {descriptionAr.length}/280
                        </span>
                        <span className={descriptionEn.length > 280 ? 'text-rose-500 font-bold' : 'text-typography-muted'}>
                          EN: {descriptionEn.length}/280
                        </span>
                      </div>
                    </div>

                    <BilingualField
                      label=""
                      valueAr={descriptionAr}
                      valueEn={descriptionEn}
                      onChangeAr={(val) => {
                        setDescriptionAr(val);
                        markDirty();
                      }}
                      onChangeEn={(val) => {
                        setDescriptionEn(val);
                        markDirty();
                      }}
                      isTextarea
                      rows={3}
                      placeholderAr="شرح موجز للخدمات الرقمية المنفذة للعميل والأثر الملموس..."
                      placeholderEn="Brief summary of digital solutions delivered and results..."
                      required
                    />
                  </div>

                  {/* Row 5: Images (Logo and Cover) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <ImageUploader
                      label="شعار العميل (Logo) *"
                      value={logo}
                      onChange={(url) => {
                        setLogo(url);
                        markDirty();
                      }}
                      description="شعار عالي الدقة بصيغة PNG أو WebP أو SVG (مطلوب)"
                    />

                    <ImageUploader
                      label="صورة الغلاف (Cover Image)"
                      value={coverImage}
                      onChange={(url) => {
                        setCoverImage(url);
                        markDirty();
                      }}
                      description="لقطة شاشة أو غلاف متجر العميل (اختياري)"
                    />
                  </div>

                  {/* Row 6: Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border-subtle">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border-subtle bg-surface-elevated/40 hover:bg-surface-elevated">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => {
                          setIsFeatured(e.target.checked);
                          markDirty();
                        }}
                        className="h-4 w-4 rounded border-border-subtle bg-surface-elevated text-brand-accent focus:ring-brand-accent"
                      />
                      <div>
                        <span className="text-xs font-bold text-typography-primary flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>تمييز المشروع في الصفحة الرئيسية</span>
                        </span>
                        <p className="text-[11px] text-typography-muted mt-0.5">
                          يظهر المشروع مباشرة في قسم معرض أعمال الصفحة الرئيسية
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border-subtle bg-surface-elevated/40 hover:bg-surface-elevated">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => {
                          setIsPublished(e.target.checked);
                          markDirty();
                        }}
                        className="h-4 w-4 rounded border-border-subtle bg-surface-elevated text-brand-accent focus:ring-brand-accent"
                      />
                      <div>
                        <span className="text-xs font-bold text-typography-primary flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          <span>نشر المشروع على الموقع العام</span>
                        </span>
                        <p className="text-[11px] text-typography-muted mt-0.5">
                          إلغاء التحديد يحفظ المشروع كمسودة مخفية عن الزوار ومحركات البحث
                        </p>
                      </div>
                    </label>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4 bg-surface-panel shrink-0">
              <span className="text-xs text-typography-muted">
                {isDirty ? 'يوجد تعديلات غير محفوظة' : 'كافة البيانات محفوظة'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-typography-secondary text-sm font-medium hover:bg-surface-elevated transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="client-form"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-brand-accent text-surface-canvas text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingClient ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="تأكيد حذف العميل ومرفقاته"
        message={`هل أنت متأكد من رغبتك في حذف العميل "${deleteTarget?.name_ar || deleteTarget?.name_en}"؟ سيتم حذف بيانات العميل نهائياً وإزالة صوره المخزنة (الشعار والغلاف) من مساحة التخزين.`}
        confirmLabel={deleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        title="تأكيد الحذف الجماعي للعملاء"
        message={`هل أنت متأكد من رغبتك في حذف (${selectedIds.length}) عملاء دفعة واحدة؟ سيتم إزالة كافة السجلات والصور المخزنة التابعة لهم من مساحة التخزين ولا يمكن التراجع.`}
        confirmLabel={bulkDeleting ? 'جاري الحذف...' : `حذف ${selectedIds.length} عملاء`}
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
};
