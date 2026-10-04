'use client';

import React, { useState } from 'react';
import { FAQ } from '@/lib/data/types';
import { getLocalizedText } from '@/lib/utils/content-helper';
import { ChevronDown } from 'lucide-react';

interface FaqAccordionProps {
  faqs: FAQ[];
  locale?: string;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ faqs, locale = 'ar' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-elevated/40 p-8 text-center text-sm text-typography-muted">
        {locale === 'ar' ? 'لا توجد أسئلة شائعة حالياً.' : 'No FAQs available at this moment.'}
      </div>
    );
  }

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const question = getLocalizedText(faq.question_ar, faq.question_en, locale);
        const answer = getLocalizedText(faq.answer_ar, faq.answer_en, locale);
        const isOpen = openIndex === idx;

        return (
          <div
            key={faq.id || idx}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'border-brand-accent/40 bg-surface-elevated shadow-sm'
                : 'border-border-subtle bg-surface-panel hover:border-brand-accent/30'
            }`}
          >
            <button
              type="button"
              id={`faq-btn-${idx}`}
              aria-controls={`faq-answer-${idx}`}
              aria-expanded={isOpen}
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between p-5 text-start font-bold text-typography-primary text-base sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-2xl"
            >
              <span>{question}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-brand-accent ms-3 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div
                id={`faq-answer-${idx}`}
                role="region"
                aria-labelledby={`faq-btn-${idx}`}
                className="px-5 pb-5 pt-1 text-sm sm:text-base leading-relaxed text-typography-muted border-t border-border-subtle/50 animate-fade-in"
              >
                <p className="whitespace-pre-line">{answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
