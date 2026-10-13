'use client';

import { useState } from 'react';
import type { Patient, Encounter, PatientOutcomesSummary, PatientPrescription } from '@/lib/types';
import { EpicStoryboard } from './EpicStoryboard';
import { QuickRxModal } from './prescriptions/QuickRxModal';

interface Props {
  patient: Patient;
  latestEncounter: Encounter | null;
  outcomes: PatientOutcomesSummary | null;
  initialPrescriptions: PatientPrescription[];
}

export function PatientSynopsisAndRx({
  patient,
  latestEncounter,
  outcomes,
  initialPrescriptions,
}: Props) {
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);
  const [prescriptions] = useState<PatientPrescription[]>(initialPrescriptions);

  const cleanPhone = patient.phone ? patient.phone.replace(/[^0-9]/g, '') : '';
  const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const handleShareExistingRx = (rx: PatientPrescription) => {
    const lines = [
      `*DR. VARUN'S PAIN CLINIC - PRESCRIPTION*`,
      `Patient: ${patient.name} (${patient.patient_code})`,
      `Date: ${new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      ``,
      `*MEDICATIONS:*`,
      ...rx.items.map(
        (it, idx) =>
          `${idx + 1}. *${it.name}* (${it.dosage || 'Std'})\n   Frequency: ${it.frequency} | Duration: ${it.duration}\n   Instruction: ${it.instructions}`
      ),
      ``,
      rx.advice ? `*CLINICAL ADVICE:*\n${rx.advice}` : null,
      ``,
      `For urgent issues, please contact clinic helpline.`,
    ].filter(Boolean);

    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Epic Storyboard (Synopsis Header) */}
      <EpicStoryboard
        patient={patient}
        latestEncounter={latestEncounter}
        outcomes={outcomes}
        onOpenRx={() => setIsRxModalOpen(true)}
      />

      {/* Recent Prescriptions Bar if any exist */}
      {prescriptions && prescriptions.length > 0 && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wide">
              <span>💊</span>
              <span>Prescription History ({prescriptions.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white px-2 py-0.5 rounded border border-slate-200 transition"
              >
                + New Rx
              </button>
              {prescriptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllPrescriptions((prev) => !prev)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  {showAllPrescriptions ? 'Show Latest Only' : `View All (${prescriptions.length})`}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {(showAllPrescriptions ? prescriptions : prescriptions.slice(0, 1)).map((rx) => (
              <div
                key={rx.id}
                className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>Prescribed on: {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {phoneParam && (
                    <button
                      type="button"
                      onClick={() => handleShareExistingRx(rx)}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium font-sans"
                    >
                      <span>📲 Share on WhatsApp</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {rx.items.map((it, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium border border-slate-200 text-[11px]"
                    >
                      {it.name} <span className="text-slate-500 font-normal">({it.frequency})</span>
                    </span>
                  ))}
                </div>

                {rx.advice && (
                  <p className="text-[11px] text-slate-600 italic">
                    Advice: {rx.advice}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Rx Modal */}
      <QuickRxModal
        patient={patient}
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        onPrescriptionSaved={() => window.location.reload()}
      />
    </>
  );
}
