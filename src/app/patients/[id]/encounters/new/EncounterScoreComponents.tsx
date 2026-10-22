'use client';

import { useState } from 'react';
import { COMMON_REGIMENS } from '@/app/patients/[id]/prescriptions/QuickRxModal';

interface ScoreSelectorProps {
  label: string;
  subtitle: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  anchorLow?: string;
  anchorHigh?: string;
}

export function ScoreSelector({
  label,
  subtitle,
  name,
  value,
  onChange,
  anchorLow = 'Normal / Best',
  anchorHigh = 'Severe / Disabled',
}: ScoreSelectorProps) {
  const currentNum = value === '' ? null : Number(value);

  const getPillColor = (score: number) => {
    if (score <= 3) return 'hover:bg-emerald-100 hover:text-emerald-900 border-slate-200';
    if (score <= 6) return 'hover:bg-amber-100 hover:text-amber-900 border-slate-200';
    return 'hover:bg-rose-100 hover:text-rose-900 border-slate-200';
  };

  const getActivePillColor = (score: number) => {
    if (score <= 3) return 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300';
    if (score <= 6) return 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300';
    return 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-300';
  };

  const getSeverityBadge = (score: number) => {
    if (score === 0) return { text: '0 · Normal / None', cls: 'bg-emerald-100 text-emerald-800' };
    if (score <= 3) return { text: `${score}/10 · Mild`, cls: 'bg-emerald-100 text-emerald-800' };
    if (score <= 6) return { text: `${score}/10 · Moderate`, cls: 'bg-amber-100 text-amber-800' };
    if (score <= 9) return { text: `${score}/10 · Severe`, cls: 'bg-rose-100 text-rose-800' };
    return { text: '10/10 · Maximum / Disabled', cls: 'bg-rose-200 text-rose-900 font-bold' };
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 space-y-2">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-slate-800">{label}</span>
          <span className="text-[11px] text-slate-500 ml-1.5">({subtitle})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {currentNum !== null ? (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                getSeverityBadge(currentNum).cls
              }`}
            >
              {getSeverityBadge(currentNum).text}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Tap 0–10 to score</span>
          )}
          {value !== '' && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10px] text-slate-400 hover:text-rose-600 px-1 font-bold"
              title="Clear score"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 0 to 10 Quick Tap Pills */}
      <div className="grid grid-cols-11 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
          const isSelected = currentNum === score;
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(String(score))}
              className={`py-1.5 text-center text-xs font-semibold rounded-md border transition cursor-pointer ${
                isSelected
                  ? getActivePillColor(score)
                  : `bg-white text-slate-700 ${getPillColor(score)}`
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
        <span>0 = {anchorLow}</span>
        <span>10 = {anchorHigh}</span>
      </div>
    </div>
  );
}

interface PainRegimensBarProps {
  currentPlan: string;
  onAppendPlan: (text: string) => void;
  onAppendNotes: (text: string) => void;
}

export function PainRegimensBar({
  currentPlan,
  onAppendPlan,
  onAppendNotes,
}: PainRegimensBarProps) {
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const handleApply = (reg: (typeof COMMON_REGIMENS)[0]) => {
    const rxLines = reg.items.map(
      (it) =>
        `• ${it.name} (${it.dosage || 'Std'}) | Dose: ${it.frequency} | Duration: ${it.duration} [${it.instructions}]`
    );
    const rxText = rxLines.join('\n');

    const separator = currentPlan.trim().length > 0 ? '\n' : '';
    onAppendPlan(`${separator}${rxText}`);

    if (reg.advice) {
      onAppendNotes(reg.advice);
    }

    setJustAdded(reg.name);
    setTimeout(() => setJustAdded(null), 3000);
  };

  return (
    <div className="border border-teal-200/90 rounded-lg p-3 bg-gradient-to-r from-teal-50/50 to-slate-50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            ⚡ 1-Click Pain Regimens (Oral Rx)
          </span>
          <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold border border-teal-200">
            Standard Protocols
          </span>
        </div>
        <span className="text-[11px] text-slate-500">1-tap appends to Plan &amp; Advice</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COMMON_REGIMENS.map((reg) => (
          <button
            key={reg.id}
            type="button"
            onClick={() => handleApply(reg)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-teal-100 text-slate-800 hover:text-teal-900 border border-slate-300 hover:border-teal-400 transition shadow-2xs cursor-pointer flex items-center gap-1"
            title={`Append ${reg.name} to Plan & advice to Notes`}
          >
            <span>+</span>
            <span>{reg.badge}</span>
          </button>
        ))}
      </div>

      {justAdded && (
        <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 animate-fadeIn">
          <span>✓</span>
          <span>Added &ldquo;{justAdded}&rdquo; regimen to Treatment Plan &amp; Notes!</span>
        </div>
      )}
    </div>
  );
}
