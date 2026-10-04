import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormErrorsProps {
  errors?: string[] | string | null;
}

export const FormErrors: React.FC<FormErrorsProps> = ({ errors }) => {
  if (!errors) return null;

  const errorList = Array.isArray(errors) ? errors : [errors];
  if (errorList.length === 0) return null;

  return (
    <div className="rounded-xl border border-status-error/30 bg-status-error/10 p-4 text-sm text-status-error">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          {errorList.map((err, i) => (
            <p key={i} className="font-medium">{err}</p>
          ))}
        </div>
      </div>
    </div>
  );
};
