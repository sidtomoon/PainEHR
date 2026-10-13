'use client';

import { useState } from 'react';
import Link from 'next/link';

export function PatientRxToolbar({ patientName }: { patientName: string }) {
  const [copied, setCopied] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Pain Clinic Prescription - ${patientName}`,
          text: `Prescription and home exercise plan for ${patientName}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="no-print mb-6">
      <div className="bg-slate-900 text-white rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <span className="text-xs font-bold block text-white">Official Medical Prescription Soft Copy</span>
            <span className="text-[11px] text-slate-400">Verified by your Pain Medicine Specialist</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg transition cursor-pointer"
          >
            <span>{copied ? '✓ Link Copied' : '🔗 Share / Save Link'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 rounded-lg shadow-sm transition active:scale-98 cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-slate-950"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Download / Print PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
