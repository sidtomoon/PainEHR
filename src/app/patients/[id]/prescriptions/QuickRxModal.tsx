'use client';

import { useState, useTransition } from 'react';
import type { Patient, PrescriptionItem } from '@/lib/types';
import { savePrescription } from './actions';

interface Props {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionSaved?: () => void;
}

const COMMON_REGIMENS: {
  name: string;
  badge: string;
  items: PrescriptionItem[];
  advice: string;
}[] = [
  {
    name: 'Neuropathic Pain Starter',
    badge: '⚡ Radiculopathy / Neuropathy',
    items: [
      {
        name: 'Tab Pregabalin 75mg',
        dosage: '75mg',
        frequency: '0-0-1 (Night HS)',
        duration: '14 days',
        instructions: 'Take at bedtime',
      },
      {
        name: 'Tab Methylcobalamin 1500mcg',
        dosage: '1500mcg',
        frequency: '1-0-0 (Morning)',
        duration: '30 days',
        instructions: 'After breakfast',
      },
    ],
    advice: 'Report any morning dizziness. Keep posture upright.\nसुबह चक्कर आने पर सूचित करें। बैठते समय कमर सीधी रखें।',
  },
  {
    name: 'Acute Spine Flare SOS',
    badge: '🔥 Acute Disc / Lumbar Flare',
    items: [
      {
        name: 'Tab Etoricoxib 90mg',
        dosage: '90mg',
        frequency: '1-0-0 (OD)',
        duration: '5 days',
        instructions: 'After lunch with water',
      },
      {
        name: 'Tab Thiocolchicoside 4mg',
        dosage: '4mg',
        frequency: '1-0-1 (BD)',
        duration: '5 days',
        instructions: 'After food',
      },
      {
        name: 'Cap Pantoprazole 40mg',
        dosage: '40mg',
        frequency: '1-0-0 (Empty Stomach)',
        duration: '5 days',
        instructions: '30 mins before breakfast',
      },
    ],
    advice: 'Strict avoidance of forward bending and weight lifting. Cold pack 15 mins twice daily.\nआगे झुकना और भारी वजन उठाना सख्त मना है। दिन में 2 बार 15 मिनट बर्फ की सिकाई करें।',
  },
  {
    name: 'Post-Procedure Recovery',
    badge: '💉 Post-Block / Injection',
    items: [
      {
        name: 'Tab Paracetamol 650mg',
        dosage: '650mg',
        frequency: '1-0-1 SOS',
        duration: '3 days',
        instructions: 'Take only if pain occurs (Max 3/day)',
      },
      {
        name: 'Cap Pantoprazole 40mg',
        dosage: '40mg',
        frequency: '1-0-0 (OD)',
        duration: '3 days',
        instructions: 'Empty stomach',
      },
    ],
    advice: 'Rest for 24 hours. Keep injection site clean and dry. Avoid intense physical exertion.\n24 घंटे आराम करें। सुई वाली जगह को सूखा रखें। भारी काम न करें।',
  },
  {
    name: 'Central Sensitization / Fibromyalgia',
    badge: '🧠 Central Pain / Nociplastic',
    items: [
      {
        name: 'Tab Duloxetine 20mg',
        dosage: '20mg',
        frequency: '1-0-0 (Morning)',
        duration: '14 days',
        instructions: 'After breakfast with food',
      },
      {
        name: 'Tab Gabapentin 100mg',
        dosage: '100mg',
        frequency: '0-0-1 (Night)',
        duration: '14 days',
        instructions: 'At bedtime',
      },
    ],
    advice: 'Gradual low-impact aerobic walking. Maintain regular sleep schedule.\nहल्की वॉक करें। सोने का समय नियमित रखें।',
  },
];

export function QuickRxModal({
  patient,
  isOpen,
  onClose,
  onPrescriptionSaved,
}: Props) {
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      name: '',
      dosage: '',
      frequency: '1-0-1',
      duration: '5 days',
      instructions: 'After food',
    },
  ]);
  const [advice, setAdvice] = useState<string>(
    'Maintain spine ergonomics. Avoid lifting heavy weights.\nकमर सीधी रखें। भारी वजन न उठाएं और आगे न झुकें।'
  );
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyRegimen = (regimen: typeof COMMON_REGIMENS[0]) => {
    setItems([...regimen.items]);
    setAdvice(regimen.advice);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        dosage: '',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'After food',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof PrescriptionItem,
    val: string
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const buildWhatsAppMessage = () => {
    const validItems = items.filter((i) => i.name.trim());
    const lines = [
      `*DR. VARUN'S PAIN CLINIC - DIGITAL PRESCRIPTION*`,
      `Patient: ${patient.name} (${patient.patient_code})`,
      `Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      ``,
      `*MEDICATIONS:*`,
      ...validItems.map(
        (it, idx) =>
          `${idx + 1}. *${it.name}* (${it.dosage || 'Std'})\n   Frequency: ${it.frequency} | Duration: ${it.duration}\n   Instruction: ${it.instructions}`
      ),
      ``,
      advice ? `*CLINICAL ADVICE:*\n${advice}` : null,
      ``,
      `For urgent issues, please contact the clinic helpline.`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = buildWhatsAppMessage();
    const cleanPhone = patient.phone ? patient.phone.replace(/[^0-9]/g, '') : '';
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSavePrescription = () => {
    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) {
      setErrorMessage('Please enter at least one medicine name');
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await savePrescription(patient.id, validItems, advice);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          if (onPrescriptionSaved) onPrescriptionSaved();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to save prescription');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Quick Rx Pad & WhatsApp Prescription
              </h3>
              <p className="text-xs text-slate-500">
                {patient.name} · {patient.patient_code} · {patient.phone || 'No phone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            {errorMessage}
          </div>
        )}

        {saveSuccess && (
          <div className="mt-3 p-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium">
            ✓ Prescription successfully recorded in patient chart!
          </div>
        )}

        <div className="overflow-y-auto space-y-4 py-3 flex-1 pr-1">
          {/* Quick Regimen Templates */}
          <div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <span>⚡ 1-Click Pain Regimens:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REGIMENS.map((reg) => (
                <button
                  key={reg.name}
                  type="button"
                  onClick={() => handleApplyRegimen(reg)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-teal-100 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 transition text-left"
                >
                  {reg.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Medications List ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 transition"
              >
                + Add Medicine
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Tab Pregabalin 75mg)"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Dosage (75mg)"
                        value={item.dosage}
                        onChange={(e) => handleUpdateItem(index, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Freq (0-0-1)"
                        value={item.frequency}
                        onChange={(e) => handleUpdateItem(index, 'frequency', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-rose-600 px-1 font-bold text-xs"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 14 days)"
                      value={item.duration}
                      onChange={(e) => handleUpdateItem(index, 'duration', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Instructions (e.g. At bedtime / After food)"
                      value={item.instructions}
                      onChange={(e) => handleUpdateItem(index, 'instructions', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice / Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              General Advice & Precautions
            </label>
            <textarea
              rows={2}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="e.g. Avoid forward bending, cold packs 15 mins twice daily..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition shadow-xs"
            >
              <span>📲 Share on WhatsApp</span>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleSavePrescription}
              className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-xs disabled:opacity-50"
            >
              {isPending ? 'Saving...' : '💾 Save to Chart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
