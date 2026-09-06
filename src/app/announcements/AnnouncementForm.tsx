'use client';

import { useActionState } from 'react';
import { createAnnouncement } from './actions';

export function AnnouncementForm() {
  const [state, action, pending] = useActionState(createAnnouncement, null);

  return (
    <form action={action} className="space-y-2">
      <textarea
        name="message"
        required
        rows={3}
        placeholder="e.g. The clinic will be closed on Friday 12th for a medical conference. Please contact reception to reschedule."
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium"
      >
        {pending ? 'Sending…' : 'Send to all opted-in patients'}
      </button>
      {state && (
        <p className={`text-xs ${state.status === 'error' ? 'text-rose-700' : 'text-teal-700'}`}>{state.message}</p>
      )}
    </form>
  );
}
