import React from 'react';

export interface TestimonialItem {
  id: string;
  quote_ar: string;
  quote_en: string;
  author_ar: string;
  author_en: string;
  company_ar?: string;
  company_en?: string;
}

interface TestimonialsSectionProps {
  items?: TestimonialItem[];
  locale?: string;
}

/**
 * Testimonials Component per Brief 4.5:
 * Must render absolutely nothing when empty, ensuring no fake statistics or placeholder quotes appear.
 */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ items, locale = 'ar' }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border-subtle bg-surface-panel p-6 shadow-sm"
          >
            <p className="text-sm sm:text-base text-typography-muted italic leading-relaxed">
              &ldquo;{locale === 'ar' ? item.quote_ar || item.quote_en : item.quote_en || item.quote_ar}&rdquo;
            </p>
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="font-bold text-sm text-typography-primary">
                {locale === 'ar' ? item.author_ar || item.author_en : item.author_en || item.author_ar}
              </p>
              {(item.company_ar || item.company_en) && (
                <p className="text-xs text-typography-muted mt-0.5">
                  {locale === 'ar' ? item.company_ar || item.company_en : item.company_en || item.company_ar}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
