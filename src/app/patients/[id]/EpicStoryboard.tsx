'use client';

import type { Patient, Encounter, PatientOutcomesSummary } from '@/lib/types';

interface Props {
  patient: Patient;
  latestEncounter: Encounter | null;
  outcomes: PatientOutcomesSummary | null;
  onOpenRx: () => void;
}

export function EpicStoryboard({
  patient,
  latestEncounter,
  outcomes,
  onOpenRx,
}: Props) {
  // Format phone for WhatsApp
  const cleanPhone = patient.phone ? patient.phone.replace(/[^0-9]/g, '') : null;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
        `Hello ${patient.name}, Dr. Varun's Pain Clinic regarding your treatment plan.`
      )}`
    : null;

  const baselinePain = outcomes?.baseline_pain ?? latestEncounter?.pain_score_nrs;
  const latestPain = outcomes?.latest_pain ?? latestEncounter?.pain_score_nrs;
  const painImproved =
    baselinePain != null && latestPain != null && latestPain < baselinePain;

  return (
    <div className="mb-4 bg-gradient-to-r from-slate-900 to-slate-850 text-white rounded-xl p-3 sm:p-3.5 shadow-sm border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Clinical Context Pill Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Active Diagnosis Pill */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg">
            <span className="text-teal-400 font-bold">🎯 Diagnosis:</span>
            <span className="font-semibold text-slate-100 max-w-[200px] truncate" title={latestEncounter?.diagnosis || 'Pending intake'}>
              {latestEncounter?.diagnosis || 'No formal diagnosis yet'}
            </span>
            {latestEncounter?.diagnosis_code && (
              <span className="text-[10px] font-mono px-1 py-0.2 bg-teal-900/60 text-teal-300 rounded border border-teal-700/50">
                {latestEncounter.diagnosis_code}
              </span>
            )}
          </div>

          {/* Pain NRS Trend Pill */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg">
            <span className="text-amber-400 font-bold">⚡ Pain (NRS):</span>
            {baselinePain != null && latestPain != null ? (
              <div className="flex items-center gap-1 font-mono font-medium">
                {baselinePain !== latestPain ? (
                  <>
                    <span className="text-slate-400">{baselinePain}/10</span>
                    <span className="text-slate-500">→</span>
                    <span className={painImproved ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {latestPain}/10
                    </span>
                    {outcomes?.pain_change_pct != null && outcomes.pain_change_pct > 0 && (
                      <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-1 py-0.2 rounded border border-emerald-800/50">
                        -{outcomes.pain_change_pct}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-200">{latestPain}/10</span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Not assessed</span>
            )}
          </div>

          {/* Last Intervention / Procedure Pill */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg">
            <span className="text-blue-400 font-bold">💉 Last Plan:</span>
            <span className="text-slate-200 font-medium max-w-[180px] truncate" title={latestEncounter?.procedure || latestEncounter?.plan || 'Conservative'}>
              {latestEncounter?.procedure || latestEncounter?.plan || 'Conservative / Medical'}
            </span>
          </div>

          {/* Red Flag Alert Pill if any */}
          {latestEncounter?.red_flags && (
            <div className="flex items-center gap-1 bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-1 rounded-lg text-[11px] font-medium" title={latestEncounter.red_flags}>
              <span>⚠️ Flag:</span>
              <span className="max-w-[120px] truncate">{latestEncounter.red_flags}</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons (Rx + WhatsApp) */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={onOpenRx}
            className="inline-flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-xs"
          >
            <span>💊 Quick Rx</span>
          </button>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs transition shadow-xs"
              title="Chat with patient on WhatsApp"
            >
              <span>💬</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          ) : (
            <span
              className="text-[11px] text-slate-500 px-2 py-1"
              title="Add phone number to enable WhatsApp"
            >
              No phone
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
