'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface BilingualFieldProps {
  label: string;
  nameAr: string;
  nameEn: string;
  valueAr?: string;
  valueEn?: string;
  placeholderAr?: string;
  placeholderEn?: string;
  onChangeAr?: (val: string) => void;
  onChangeEn?: (val: string) => void;
  isTextarea?: boolean;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  description?: string;
}

export const BilingualField: React.FC<BilingualFieldProps> = ({
  label,
  nameAr,
  nameEn,
  valueAr = '',
  valueEn = '',
  placeholderAr = '',
  placeholderEn = '',
  onChangeAr,
  onChangeEn,
  isTextarea = false,
  rows = 3,
  maxLength,
  required = false,
  description,
}) => {
  const isArMissing = !valueAr.trim();
  const isEnMissing = !valueEn.trim();
  const hasEmptyWarning = (isArMissing && !isEnMissing) || (!isArMissing && isEnMissing);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-typography-primary">
          {label} {required && <span className="text-status-error">*</span>}
        </label>
        {hasEmptyWarning && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-accent">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {isArMissing ? 'تنبيه: النص العربي فارغ' : 'Warning: English is empty'}
            </span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-typography-muted">{description}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Arabic Input (RTL) */}
        <div>
          <div className="flex items-center justify-between mb-1 text-xs text-typography-muted">
            <span className="font-semibold text-brand-accent">العربية (AR)</span>
            {maxLength && <span>{valueAr.length}/{maxLength}</span>}
          </div>
          {isTextarea ? (
            <textarea
              name={nameAr}
              rows={rows}
              value={valueAr}
              onChange={(e) => onChangeAr?.(e.target.value)}
              placeholder={placeholderAr}
              maxLength={maxLength}
              aria-label={`${label} (بالعربية)`}
              dir="rtl"
              className="block w-full rounded-lg border border-border-strong bg-surface-sunken p-3 text-sm text-typography-primary placeholder:text-typography-muted/50 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          ) : (
            <input
              type="text"
              name={nameAr}
              value={valueAr}
              onChange={(e) => onChangeAr?.(e.target.value)}
              placeholder={placeholderAr}
              maxLength={maxLength}
              aria-label={`${label} (بالعربية)`}
              dir="rtl"
              className="block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary placeholder:text-typography-muted/50 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          )}
        </div>

        {/* English Input (LTR) */}
        <div>
          <div className="flex items-center justify-between mb-1 text-xs text-typography-muted">
            <span className="font-semibold text-brand-accent">English (EN)</span>
            {maxLength && <span>{valueEn.length}/{maxLength}</span>}
          </div>
          {isTextarea ? (
            <textarea
              name={nameEn}
              rows={rows}
              value={valueEn}
              onChange={(e) => onChangeEn?.(e.target.value)}
              placeholder={placeholderEn}
              maxLength={maxLength}
              aria-label={`${label} (English)`}
              dir="ltr"
              className="block w-full rounded-lg border border-border-strong bg-surface-sunken p-3 text-sm text-typography-primary placeholder:text-typography-muted/50 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          ) : (
            <input
              type="text"
              name={nameEn}
              value={valueEn}
              onChange={(e) => onChangeEn?.(e.target.value)}
              placeholder={placeholderEn}
              maxLength={maxLength}
              aria-label={`${label} (English)`}
              dir="ltr"
              className="block w-full rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2.5 text-sm text-typography-primary placeholder:text-typography-muted/50 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          )}
        </div>
      </div>
    </div>
  );
};
