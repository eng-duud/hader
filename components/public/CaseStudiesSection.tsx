import React from 'react';

export interface CaseStudyItem {
  id: string;
  title_ar: string;
  title_en: string;
  metric_value: string;
  metric_label_ar: string;
  metric_label_en: string;
}

/**
 * Case Study / Metrics Component per Brief 4.5:
 * Must render absolutely nothing when empty, ensuring no artificial claims are displayed.
 */
export const CaseStudiesSection: React.FC<{ items?: CaseStudyItem[]; locale?: string }> = ({
  items,
  locale = 'ar',
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((cs) => (
          <div
            key={cs.id}
            className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 text-center"
          >
            <div className="text-3xl font-extrabold text-brand-accent">{cs.metric_value}</div>
            <p className="mt-2 text-sm font-semibold text-typography-primary">
              {locale === 'ar' ? cs.title_ar : cs.title_en}
            </p>
            <p className="mt-1 text-xs text-typography-muted">
              {locale === 'ar' ? cs.metric_label_ar : cs.metric_label_en}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
