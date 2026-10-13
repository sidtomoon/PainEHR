'use client';

import { useState } from 'react';

export interface SmartPhrase {
  trigger: string;
  label: string;
  category: 'procedure' | 'exam' | 'safety' | 'clinical';
  text: string;
}

export const SMART_PHRASES: SmartPhrase[] = [
  {
    trigger: '.tfesi',
    label: 'L-TFESI Epidural',
    category: 'procedure',
    text: 'Fluoroscopy-guided Transforaminal Epidural Steroid Injection (TFESI). Strict aseptic prep and drape done. 22G Quincke spinal needle advanced under AP and lateral fluoroscopy to safe triangle. Omnipaque 240 (1.5ml) confirmed epidural spread without vascular uptake. Injected 2ml Ropivacaine 0.2% + Dexamethasone 4mg. Tolerated well without immediate complications.',
  },
  {
    trigger: '.facet',
    label: 'Medial Branch Block',
    category: 'procedure',
    text: 'Fluoroscopy-guided Lumbar Medial Branch Block. Identified target transverse process-superior articular process junctions. Injected 0.5ml 0.5% Bupivacaine per target level. Immediate post-block reassessment showed >80% pain relief on lumbar extension and facet loading.',
  },
  {
    trigger: '.kneeprf',
    label: 'Genicular Nerve Block',
    category: 'procedure',
    text: 'Ultrasound-guided Genicular Nerve Block (SLGN, SMGN, IMGN). Identified target bony landmarks and genicular vessels using colour Doppler. Injected 1ml 0.5% Bupivacaine + 2mg Triamcinolone per site under aseptic precautions.',
  },
  {
    trigger: '.exam',
    label: 'Pain Spine Exam',
    category: 'exam',
    text: 'Physical Exam: Gait normal. Lumbar lordosis maintained. Extension reproduces axial discomfort. Bilateral SLRT negative (>70°). FABER negative bilaterally. Motor 5/5 bilateral lower limbs (L2-S1), DTR intact, no sensory loss.',
  },
  {
    trigger: '.redflags',
    label: 'Red Flags Screened (Neg)',
    category: 'safety',
    text: 'Red flags screened and absent: No fever, no constitutional symptoms or weight loss, no history of malignancy, no cauda equina / bowel-bladder involvement, no progressive motor weakness.',
  },
  {
    trigger: '.consent',
    label: 'Procedural Consent',
    category: 'safety',
    text: 'Informed written procedural consent obtained after thorough counseling on indications, anticipated pain relief, potential risks (infection, bleeding, transient motor block, nerve irritation, dural puncture), and post-procedure care.',
  },
  {
    trigger: '.postop',
    label: 'Post-Op Recovery',
    category: 'procedure',
    text: 'Observed in recovery room for 30 minutes. Vitals stable. Lower extremity sensations and motor power intact. Ambulated comfortably. Discharged with emergency contact and scheduled follow-up.',
  },
  {
    trigger: '.sciatica',
    label: 'Lumbar Radiculopathy',
    category: 'clinical',
    text: 'Lower extremity dermatomal radicular pain aggravated by sitting and lumbar forward bending. Positive nerve tension signs. Concordant with neuroforaminal disc pathology.',
  },
];

interface Props {
  onInsert: (text: string) => void;
}

export function SmartPhrasesPicker({ onInsert }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = SMART_PHRASES.filter(
    (p) =>
      p.label.toLowerCase().includes(filter.toLowerCase()) ||
      p.trigger.toLowerCase().includes(filter.toLowerCase()) ||
      p.text.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="mb-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1 shrink-0 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
            <span>⚡ SmartPhrases</span>
          </span>
          {SMART_PHRASES.slice(0, 4).map((phrase) => (
            <button
              key={phrase.trigger}
              type="button"
              onClick={() => onInsert(phrase.text)}
              className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 transition"
              title={`${phrase.trigger}: Click to insert`}
            >
              {phrase.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
          >
            + All ({SMART_PHRASES.length})
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-4 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <h4 className="text-sm font-semibold text-slate-900">
                  Epic SmartPhrases / DotPhrases
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="py-2.5">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search templates or triggers (.tfesi, .exam, etc.)..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filtered.map((phrase) => (
                <div
                  key={phrase.trigger}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/30 transition group flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        {phrase.trigger}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {phrase.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onInsert(phrase.text);
                        setIsOpen(false);
                      }}
                      className="px-2 py-1 text-xs font-semibold rounded bg-teal-600 text-white hover:bg-teal-700 transition"
                    >
                      Insert ↵
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {phrase.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 flex justify-between items-center">
              <span>Click Insert to append template into your note.</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-600 font-medium hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
