/**
 * Event form validation and submission logic
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';

export type EventType = 'wedding' | 'birthday' | 'community';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'JPY';

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  CAD: 2,
  AUD: 2,
  JPY: 0,
};

export function getTodayInTimezone(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  } catch {
    return new Date().toISOString().split('T')[0]!;
  }
}

interface FormData {
  type: EventType;
  title: string;
  eventDate: string;
  timezone: string;
  city: string;
  guestCount: string;
  currency: Currency;
  totalBudget: string;
  preferences: string;
}

interface FormErrors {
  type?: string;
  title?: string;
  eventDate?: string;
  city?: string;
  guestCount?: string;
  totalBudget?: string;
  preferences?: string;
  submit?: string;
}

export function useEventForm() {
  const router = useRouter();

  const [formData, setFormData] = React.useState<FormData>({
    type: 'wedding',
    title: '',
    eventDate: '',
    timezone: '',
    city: '',
    guestCount: '',
    currency: 'USD',
    totalBudget: '',
    preferences: '',
  });

  const [fieldErrors, setFieldErrors] = React.useState<FormErrors>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [showTimezoneEdit, setShowTimezoneEdit] = React.useState(false);

  // Auto-detect timezone on mount
  React.useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFormData((prev) => ({ ...prev, timezone: detected }));
    } catch {
      setFormData((prev) => ({ ...prev, timezone: 'UTC' }));
    }
  }, []);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof FormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const { type, title, eventDate, timezone, city, guestCount, currency, totalBudget, preferences } = formData;

    if (!type) {
      errors.type = 'Event type is required';
    }

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    if (!eventDate) {
      errors.eventDate = 'Event date is required';
    } else {
      const today = getTodayInTimezone(timezone);
      if (eventDate < today) {
        errors.eventDate = 'Choose today or a later date';
      }
    }

    if (city && city.length > 200) {
      errors.city = 'City must not exceed 200 characters';
    }

    const guests = parseInt(guestCount, 10);
    if (!guestCount) {
      errors.guestCount = 'Guest count is required';
    } else if (isNaN(guests) || guests < 1) {
      errors.guestCount = 'Guest count must be at least 1';
    } else if (guests > 5000) {
      errors.guestCount = 'Guest count must not exceed 5,000';
    }

    if (!totalBudget) {
      errors.totalBudget = 'Total budget is required';
    } else {
      const decimals = CURRENCY_DECIMALS[currency];
      const regex =
        decimals > 0
          ? new RegExp(`^\\d{1,12}(\\.\\d{1,${decimals}})?$`)
          : /^\d{1,12}$/;

      if (!regex.test(totalBudget)) {
        errors.totalBudget =
          decimals > 0
            ? `Enter a valid amount with up to ${decimals} decimal places`
            : 'Enter a valid whole number';
      }
    }

    if (preferences && preferences.length > 300) {
      errors.preferences = 'Preferences must not exceed 300 characters';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { type, title, eventDate, timezone, city, guestCount, currency, totalBudget, preferences } = formData;
      
      // Convert budget to minor units
      const decimals = CURRENCY_DECIMALS[currency];
      const totalBudgetMinor = Math.round(
        parseFloat(totalBudget) * Math.pow(10, decimals)
      );

      const payload = {
        type,
        title: title.trim(),
        eventDate,
        timezone,
        city: city.trim() || null,
        guestCount: parseInt(guestCount, 10),
        currency,
        totalBudgetMinor,
        preferences: preferences.trim() ? { text: preferences.trim() } : undefined,
      };

      const response = await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create event');
      }

      const { event } = await response.json();

      router.push(`/events/${event.id}?generating=1`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event. Please try again.';
      setFieldErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    fieldErrors,
    isLoading,
    showTimezoneEdit,
    setShowTimezoneEdit,
    updateField,
    handleSubmit,
  };
}
