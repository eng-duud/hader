'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Client, ClientCategory } from '@/lib/data/types';
import { getLocalizedText } from '@/lib/utils/content-helper';
import { Link } from '@/navigation';
import { ExternalLink, Briefcase, Star, ArrowUpRight } from 'lucide-react';

interface ClientFilterChipsProps {
  categories: ClientCategory[];
  clients: Client[];
  locale?: string;
}

export const ClientFilterChips: React.FC<ClientFilterChipsProps> = ({
  categories,
  clients,
  locale = 'ar',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter clients
  const filteredClients = useMemo(() => {
    if (selectedCategory === 'all') {
      return clients;
    }
    return clients.filter((c) => c.category_id === selectedCategory);
  }, [clients, selectedCategory]);

  return (
    <div className="space-y-12">
      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
            selectedCategory === 'all'
              ? 'bg-brand-primary text-brand-primary-foreground shadow-md scale-105'
              : 'border border-border-subtle bg-surface-elevated text-typography-muted hover:border-brand-accent hover:text-typography-primary'
          }`}
        >
          <span>{locale === 'ar' ? 'كافة القطاعات' : 'All Sectors'}</span>
          <span className="ms-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] opacity-80">
            {clients.length}
          </span>
        </button>

        {categories.map((cat) => {
          const catName = getLocalizedText(cat.name_ar, cat.name_en, locale);
          const count = clients.filter((c) => c.category_id === cat.id).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-primary text-brand-primary-foreground shadow-md scale-105'
                  : 'border border-border-subtle bg-surface-elevated text-typography-muted hover:border-brand-accent hover:text-typography-primary'
              }`}
            >
              <span>{catName}</span>
              <span className="ms-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] opacity-80">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Client Cards */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-elevated/40 p-16 text-center max-w-lg mx-auto animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken text-brand-accent mb-4">
            <Briefcase className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-typography-primary">
            {locale === 'ar' ? 'لا توجد مشاريع منشورة في هذا التصنيف بعد' : 'No published projects in this sector yet'}
          </h3>
          <p className="mt-1 text-xs text-typography-muted">
            {locale === 'ar'
              ? 'نعمل باستمرار على إطلاق وتحديث مشاريع عملائنا.'
              : 'We are continually launching and updating client presence.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
          {filteredClients.map((client) => {
            const name = getLocalizedText(client.name_ar, client.name_en, locale);
            const desc = getLocalizedText(client.description_ar, client.description_en, locale);
            const catName = client.category
              ? getLocalizedText(client.category.name_ar, client.category.name_en, locale)
              : null;

            return (
              <div
                key={client.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-panel overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-accent/50 transition-all duration-300"
              >
                <div>
                  {/* Visual Header / Cover */}
                  <div className="relative aspect-video w-full bg-surface-sunken overflow-hidden border-b border-border-subtle">
                    {client.cover_image ? (
                      <Image
                        src={client.cover_image}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-sunken to-surface-elevated">
                        <Briefcase className="h-10 w-10 text-brand-accent/30" />
                      </div>
                    )}

                    {/* Logo Overlay Badge */}
                    <div className="absolute start-4 bottom-3 h-14 w-14 rounded-2xl bg-surface-panel/95 p-1.5 shadow-lg backdrop-blur-md border border-border-subtle flex items-center justify-center overflow-hidden">
                      {client.logo ? (
                        <Image
                          src={client.logo}
                          alt={`${name} logo`}
                          width={48}
                          height={48}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-typography-muted">شعار</span>
                      )}
                    </div>

                    {/* Featured Tag */}
                    {client.is_featured && (
                      <div className="absolute top-3 end-3 flex items-center gap-1 rounded-full bg-surface-panel/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-amber-400/30 shadow-sm">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{locale === 'ar' ? 'مشروع مميز' : 'Featured'}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="p-6 pt-5 space-y-3">
                    {catName && (
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2.5 py-0.5 rounded-full border border-brand-accent/20">
                        {catName}
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-typography-primary group-hover:text-brand-accent transition-colors">
                      <Link href={`/clients/${client.slug}`}>
                        {name}
                      </Link>
                    </h3>

                    <p className="text-xs sm:text-sm text-typography-muted leading-relaxed line-clamp-3">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-6 pt-0 border-t border-border-subtle/50 mt-4 flex items-center justify-between">
                  <Link
                    href={`/clients/${client.slug}`}
                    className="text-xs font-semibold text-typography-secondary hover:text-typography-primary inline-flex items-center gap-1"
                  >
                    <span>{locale === 'ar' ? 'تفاصيل المشروع' : 'View Details'}</span>
                    <ArrowUpRight className="h-3 w-3 rtl:rotate-90" />
                  </Link>

                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:underline py-1.5 px-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent/20 transition-colors"
                  >
                    <span>{locale === 'ar' ? 'زيارة الموقع الحي' : 'Visit live site'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
