'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createPatient } from '@/app/patients/actions';

export default function NewPatientPage() {
  const [state, action, pending] = useActionState(createPatient, null);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
      <Link href="/patients" className="text-xs text-slate-400 hover:text-slate-600">
        ← Patients
      </Link>
      <h2 className="text-lg font-semibold mt-2 mb-4">New patient</h2>

      {state?.status === 'error' && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            name="name"
            required
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Age</label>
            <input
              name="age"
              type="number"
              min={0}
              max={130}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Sex</label>
            <select
              name="sex"
              defaultValue=""
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">—</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone (optional)</label>
          <input
            name="phone"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="whatsapp_opt_in" className="rounded border-slate-300" />
            Patient has consented to WhatsApp appointment reminders
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="research_consent" className="rounded border-slate-300" />
            Patient has consented to research use of their data
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium mt-2"
        >
          {pending ? 'Saving…' : 'Save patient'}
        </button>
      </form>
    </div>
  );
}
