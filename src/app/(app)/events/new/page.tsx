/**
 * Create event page
 * Spec: prd.md §3.2 US-05, US-06, §4 screens and navigation
 * Eight-field form with timezone auto-detection
 */

import { EventForm } from './_components/event-form';

export default function NewEventPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-text mb-8">Create your event</h1>
      <EventForm />
    </div>
  );
}
