/**
 * Event creation form UI
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyField } from '@/components/ui/money-field';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useEventForm, getTodayInTimezone, type EventType, type Currency } from '../_hooks/use-event-form';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
};

export function EventForm() {
  const router = useRouter();
  const {
    formData,
    fieldErrors,
    isLoading,
    showTimezoneEdit,
    setShowTimezoneEdit,
    updateField,
    handleSubmit,
  } = useEventForm();

  const minDate = getTodayInTimezone(formData.timezone);

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event type */}
          <div>
            <label htmlFor="type" className="block text-base font-medium text-text mb-2">
              Event type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => updateField('type', e.target.value as EventType)}
              className="block w-full rounded-control border border-border px-3 py-2 text-base bg-surface text-text transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] md:min-h-[32px]"
              disabled={isLoading}
              required
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="community">Community event</option>
            </select>
            {fieldErrors.type && (
              <p className="mt-2 text-sm text-over-fg">{fieldErrors.type}</p>
            )}
          </div>

          {/* Title */}
          <Input
            id="title"
            label="Event title"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            error={fieldErrors.title}
            disabled={isLoading}
            maxLength={200}
            required
          />

          {/* Event date */}
          <Input
            id="eventDate"
            label="Event date"
            type="date"
            value={formData.eventDate}
            onChange={(e) => updateField('eventDate', e.target.value)}
            error={fieldErrors.eventDate}
            helperText={`Timezone: ${formData.timezone}`}
            min={minDate}
            disabled={isLoading}
            required
          />

          {/* Timezone edit */}
          {!showTimezoneEdit && (
            <button
              type="button"
              onClick={() => setShowTimezoneEdit(true)}
              className="text-base text-primary hover:text-primary-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 rounded-control"
            >
              Change timezone
            </button>
          )}

          {showTimezoneEdit && (
            <Input
              id="timezone"
              label="Timezone"
              value={formData.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              helperText="IANA timezone name (e.g., America/New_York)"
              disabled={isLoading}
              required
            />
          )}

          {/* City (optional) */}
          <Input
            id="city"
            label="City (optional)"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            error={fieldErrors.city}
            disabled={isLoading}
            maxLength={200}
          />

          {/* Guest count */}
          <Input
            id="guestCount"
            label="Guest count"
            type="number"
            inputMode="numeric"
            value={formData.guestCount}
            onChange={(e) => updateField('guestCount', e.target.value)}
            error={fieldErrors.guestCount}
            disabled={isLoading}
            min={1}
            max={5000}
            required
          />

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-base font-medium text-text mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => updateField('currency', e.target.value as Currency)}
              className="block w-full rounded-control border border-border px-3 py-2 text-base bg-surface text-text transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] md:min-h-[32px]"
              disabled={isLoading}
              required
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD (CA$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          {/* Total budget */}
          <MoneyField
            id="totalBudget"
            label="Total budget"
            value={formData.totalBudget}
            onChange={(e) => updateField('totalBudget', e.target.value)}
            error={fieldErrors.totalBudget}
            currencySymbol={CURRENCY_SYMBOLS[formData.currency]}
            disabled={isLoading}
            required
          />

          {/* Preferences (optional) */}
          <Textarea
            id="preferences"
            label="Preferences (optional)"
            value={formData.preferences}
            onChange={(e) => updateField('preferences', e.target.value)}
            error={fieldErrors.preferences}
            helperText={`${formData.preferences.length}/300 characters`}
            disabled={isLoading}
            maxLength={300}
            rows={3}
          />

          {/* Submit error */}
          {fieldErrors.submit && (
            <div
              className="rounded-control bg-over-bg border border-over-fg/20 p-3 text-base text-over-fg"
              role="alert"
            >
              {fieldErrors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating event...
                </>
              ) : (
                'Create event'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
