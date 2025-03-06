import { useState } from 'react';
import { SessionFormData } from '@/types/session';
import { validateSessionData } from '@/utils/validation';

export const useSessionForm = (initialData?: Partial<SessionFormData>) => {
  const [formData, setFormData] = useState<SessionFormData>({
    activityId: '',
    instructorId: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    recurrence: {
      type: 'none',
      interval: 1
    },
    maxCapacity: 1,
    notes: '',
    description: '',
    link: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const validationError = validateSessionData(formData);
    if (validationError) {
      setErrors({ form: validationError });
      return false;
    }
    setErrors({});
    return true;
  };

  return {
    formData,
    setFormData,
    errors,
    validateForm
  };
};