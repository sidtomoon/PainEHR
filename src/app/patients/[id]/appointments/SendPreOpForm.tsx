'use client';

import { useActionState, useState } from 'react';
import { sendPreOpMessage } from './actions';

export function SendPreOpForm({ patientId, appointmentId }: { patientId: string; appointmentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(sendPreOpMessage.bind(null, patientId, appointmentId), null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-teal-700 hover:text-teal-900 font-medium">
        Send pre-op instructions
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 space-y-2 w-full">
      <input
        name="procedure_name" placeholder="Procedure name"
        className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <textarea
        name="instructions" rows={2} placeholder="e.g. Stop clopidogrel 5 days prior. Bring your last MRI film. Fast for 6 hours before arrival."
        className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded px-3 py-1.5 font-medium">
          {pending ? 'Sending…' : 'Send'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
      </div>
      {state && (
        <p className={`text-xs ${state.status === 'error' ? 'text-rose-700' : 'text-teal-700'}`}>{state.message}</p>
      )}
    </form>
  );
}
