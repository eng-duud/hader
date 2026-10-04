'use client';

import { useEffect } from 'react';

interface UnsavedChangesGuardProps {
  isDirty: boolean;
  message?: string;
}

export const UnsavedChangesGuard: React.FC<UnsavedChangesGuardProps> = ({
  isDirty,
  message = 'لديك تعديلات غير محفوظة. هل أنت متأكد من مغادرة هذه الصفحة؟',
}) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);

  return null;
};
