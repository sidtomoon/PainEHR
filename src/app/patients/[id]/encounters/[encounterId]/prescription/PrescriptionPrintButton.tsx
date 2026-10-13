'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PrescriptionPrintButtonProps {
  patientId: string;
  encounterId: string;
  patientPhone?: string | null;
  patientName?: string;
  summaryText: string;
  isNewEncounter?: boolean;
}

export function PrescriptionPrintButton({
  patientId,
  encounterId,
  patientPhone,
  patientName,
  summaryText,
  isNewEncounter = false,
}: PrescriptionPrintButtonProps) {
  const [copied, setCopied] = useState(false);
  const [copiedPatientLink, setCopiedPatientLink] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }

  function getPatientUrl() {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/rx/${encounterId}`;
    }
    return `/rx/${encounterId}`;
  }

  async function copyPatientLink() {
    try {
      await navigator.clipboard.writeText(getPatientUrl());
      setCopiedPatientLink(true);
      setTimeout(() => setCopiedPatientLink(false), 2500);
    } catch {
      // ignore
    }
  }

  const cleanPhone = (patientPhone || '').replace(/[^0-9]/g, '');
  const whatsAppText = encodeURIComponent(
    `Hello ${patientName || ''},\nHere is your official Pain Clinic prescription & guided home exercises link:\n${getPatientUrl()}\n\nYou can view your prescription and follow your guided PRT, Graded PT, and Yoga exercises on any phone or computer.`
  );
  const whatsAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${whatsAppText}`
    : `https://wa.me/?text=${whatsAppText}`;

  return (
    <div className="no-print mb-6 space-y-2">
      {isNewEncounter && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span>
              <strong>Encounter recorded successfully!</strong> Your prescription soft copy has been prepared.
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-medium">
            Saved to Record
          </span>
        </div>
      )}

      <div className="bg-slate-900 text-white rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Link
            href={`/patients/${patientId}`}
            className="inline-flex items-center text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition"
          >
            ← Back to Patient
          </Link>
          <div className="text-xs text-slate-400 hidden sm:block">
            Choose <strong className="text-slate-200 font-semibold">&ldquo;Save as PDF&rdquo;</strong> in the print dialog
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyPatientLink}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 px-3 py-2 rounded-lg transition cursor-pointer"
            title="Copy patient-facing prescription link"
          >
            <span>{copiedPatientLink ? '✓ Link Copied' : '🔗 Patient Link'}</span>
          </button>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition shadow-xs"
            title="Send prescription & digital exercises via WhatsApp"
          >
            <span>📲 WhatsApp Patient</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg transition cursor-pointer"
            title="Copy prescription text summary to clipboard"
          >
            <span>{copied ? '✓ Copied' : '📋 Copy Text'}</span>
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
