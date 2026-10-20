'use client';

import { useState } from 'react';
import type { Patient } from '@/lib/types';

interface OptedInPatient {
  id: string;
  name: string;
  patient_code: string;
  phone: string;
}

interface Props {
  patients: OptedInPatient[];
  isAutomatedConfigured: boolean;
  createAction: (message: string) => Promise<{ status: 'sent' | 'error'; message: string }>;
}

export function BroadcastDispatcher({
  patients,
  isAutomatedConfigured,
  createAction,
}: Props) {
  const [message, setMessage] = useState('');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const formattedBroadcast = `*CLINIC ANNOUNCEMENT — DR. VARUN'S PAIN CLINIC*\n\n${message}\n\nFor queries or appointment rescheduling, please reply to this WhatsApp message.`;

  const handleSendSingle = (p: OptedInPatient) => {
    if (!message.trim()) {
      alert('Please enter an announcement message first.');
      return;
    }

    const cleanPhone = p.phone.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(formattedBroadcast)}`;
    window.open(url, '_blank');

    setSentMap((prev) => ({ ...prev, [p.id]: true }));
  };

  const handleCopyText = () => {
    if (!message.trim()) return;
    navigator.clipboard.writeText(formattedBroadcast);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToHistory = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    setStatusFeedback(null);
    try {
      const res = await createAction(message.trim());
      setStatusFeedback(res.message);
    } catch {
      setStatusFeedback('Failed to log announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sentCount = Object.keys(sentMap).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <span>📢</span>
          <span>Compose Clinic Broadcast</span>
        </h3>
        {message.trim() && (
          <button
            type="button"
            onClick={handleCopyText}
            className="text-xs text-teal-700 hover:text-teal-900 font-medium underline"
          >
            {copied ? '✓ Copied formatted text' : 'Copy formatted text'}
          </button>
        )}
      </div>

      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. Clinic will remain closed from Oct 25-27 as Dr. Varun is attending the National Pain Conference. Routine OPD resumes on Monday 28 Oct."
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          Target Audience: <strong>{patients.length}</strong> opted-in patients ({sentCount} sent this session)
        </div>

        <button
          type="button"
          disabled={!message.trim() || isSubmitting}
          onClick={handleSaveToHistory}
          className="bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          {isSubmitting ? 'Logging...' : '💾 Log to History'}
        </button>
      </div>

      {statusFeedback && (
        <div className="p-2 text-xs bg-slate-100 text-slate-700 rounded-md">
          {statusFeedback}
        </div>
      )}

      {/* 1-Click WhatsApp Dispatch List */}
      {message.trim() && patients.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span>Free 1-Click WhatsApp Dispatch Queue</span>
            <span className="text-[11px] font-normal text-slate-500">
              Opens WhatsApp Web with pre-filled message
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {patients.map((p) => {
              const isSent = !!sentMap[p.id];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {p.patient_code}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      · {p.phone}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendSingle(p)}
                    className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded transition ${
                      isSent
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                    }`}
                  >
                    <span>📲</span>
                    <span>{isSent ? '✓ Sent (Re-send)' : 'Send'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
