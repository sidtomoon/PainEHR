'use client';

import { useActionState } from 'react';
import { submitCheckin } from './actions';
import { PATIENT_GLOBAL_IMPRESSIONS } from '@/lib/types';

const LABELS: Record<string, string> = {
  much_worse: 'Much worse',
  worse: 'A bit worse',
  no_change: 'About the same',
  better: 'A bit better',
  much_better: 'Much better',
};

export function CheckinForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(submitCheckin.bind(null, token), null);

  if (state?.status === 'sent') {
    return <p className="text-sm text-teal-700 mt-3">{state.message}</p>;
  }

  return (
    <form action={action} className="space-y-2">
      {PATIENT_GLOBAL_IMPRESSIONS.map((opt) => (
        <button
          key={opt}
          type="submit"
          name="response"
          value={opt}
          disabled={pending}
          className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-sm text-slate-700 disabled:opacity-50"
        >
          {LABELS[opt]}
        </button>
      ))}
      {state?.status === 'error' && (
        <p className="text-xs text-rose-700 mt-2">{state.message}</p>
      )}
    </form>
  );
}
