'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NonInvasiveRxBuilderProps {
  currentPlan: string;
  onAppendPlan: (text: string) => void;
  onAppendAdvice?: (text: string) => void;
}

export function NonInvasiveRxBuilder({
  currentPlan,
  onAppendPlan,
  onAppendAdvice,
}: NonInvasiveRxBuilderProps) {
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const modalitiesRx = [
    {
      id: 'prt',
      name: 'PRT (Lin Health)',
      badge: 'Neuroplastic',
      color: 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100',
      rxText:
        '• Pain Reprocessing Therapy (PRT): Somatic tracking & safety reappraisal 10–15 mins daily to desensitize central nervous system threat alarms. Focus on curiosity-driven observation without fear (JAMA Psych).',
      route: '/modalities/prt',
    },
    {
      id: 'graded_pt',
      name: 'Graded PT (Hinge/Kaia)',
      badge: 'Pacing / GET',
      color: 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100',
      rxText:
        '• Psychologically-Informed PT & Graded Exercise: Traffic light pacing (Green safe daily baseline, Yellow "hurt does not equal harm" graded challenge). Core stabilizers: pelvic tilts, bridges, bird-dog 15 mins daily.',
      route: '/modalities/graded-pt',
    },
    {
      id: 'act',
      name: 'ACT for Pain',
      badge: 'Values-Based',
      color: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
      rxText:
        '• Acceptance & Commitment Therapy (ACT): Practice values-based committed action (Values Bull’s-Eye) and cognitive defusion ("unhooking from catastrophic pain thoughts") to restore life vitality.',
      route: '/modalities/act',
    },
    {
      id: 'yoga',
      name: 'CLBP Yoga',
      badge: 'Spine Pacing',
      color: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
      rxText:
        '• Evidence-Based Yoga for Back Pain: Spine-sparing asanas (Cat-Cow, Supported Sphinx/Bridge, Elevated-Knee Rest) + 4s-6s Pranayama breathing pacer, 20 mins 3x/week (Annals Int Med).',
      route: '/modalities/yoga',
    },
    {
      id: 'cbt_i',
      name: 'CBT-I (Somryst)',
      badge: 'Sleep Drive',
      color: 'border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100',
      rxText:
        '• CBT-I Sleep-Pain Protocol: Enforce 20-minute stimulus control rule (leave bed if awake & ruminating on pain); consolidate sleep via personalized bedtime window to reduce next-day central sensitization.',
      route: '/modalities/cbt-i',
    },
  ];

  function handleAdd(item: (typeof modalitiesRx)[0]) {
    const separator = currentPlan.trim().length > 0 ? '\n' : '';
    onAppendPlan(`${separator}${item.rxText}`);
    setJustAdded(item.name);
    setTimeout(() => setJustAdded(null), 2000);
  }

  return (
    <div className="border border-slate-200 rounded-lg p-3.5 bg-gradient-to-br from-slate-50 to-teal-50/30 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            🌐 Non-Invasive Modalities &amp; Digital Rx
          </span>
          <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold border border-teal-200">
            Commercial Models
          </span>
        </div>
        <Link
          href="/modalities"
          target="_blank"
          className="text-[11px] text-teal-700 hover:text-teal-900 font-medium underline"
        >
          Open Modalities Suite ↗
        </Link>
      </div>

      <p className="text-[11px] text-slate-500">
        Click to 1-click prescribe evidence-based non-invasive regimens directly into the Treatment Plan:
      </p>

      {/* 5 1-Click Prescription Buttons */}
      <div className="flex flex-wrap gap-2">
        {modalitiesRx.map((item) => (
          <div key={item.id} className="inline-flex items-center rounded-lg border shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => handleAdd(item)}
              className={`text-xs px-2.5 py-1.5 font-semibold transition cursor-pointer flex items-center gap-1 ${item.color}`}
              title={`Add ${item.name} protocol to Treatment Plan`}
            >
              <span>+</span>
              <span>{item.name}</span>
              <span className="text-[9px] opacity-75 font-normal uppercase">({item.badge})</span>
            </button>
            <Link
              href={item.route}
              target="_blank"
              className="px-1.5 py-1.5 text-[11px] bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-l border-slate-200 transition"
              title={`Open interactive ${item.name} session in new tab`}
            >
              ↗
            </Link>
          </div>
        ))}
      </div>

      {justAdded && (
        <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 animate-pulse">
          <span>✓</span>
          <span>Added &ldquo;{justAdded}&rdquo; protocol to Treatment Plan!</span>
        </div>
      )}
    </div>
  );
}
