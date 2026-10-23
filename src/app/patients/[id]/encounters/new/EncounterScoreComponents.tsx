'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COMMON_REGIMENS } from '@/app/patients/[id]/prescriptions/QuickRxModal';
import { SMART_PHRASES } from '@/app/components/SmartPhrasesPicker';
import { getManagementProtocol, buildCompleteProtocolSummary } from '@/lib/clinical-decision-rules';

// ── COMPACT 0-10 SCORE SELECTOR ──
interface ScoreSelectorProps {
  label: string;
  subtitle: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}

export function ScoreSelector({
  label,
  subtitle,
  name,
  value,
  onChange,
}: ScoreSelectorProps) {
  const currentNum = value === '' ? null : Number(value);

  const getPillCls = (score: number) => {
    if (currentNum === score) {
      if (score <= 3) return 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300 shadow-xs';
      if (score <= 6) return 'bg-amber-500 text-white font-bold ring-2 ring-amber-300 shadow-xs';
      return 'bg-rose-600 text-white font-bold ring-2 ring-rose-300 shadow-xs';
    }
    return 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200';
  };

  const getBadge = (score: number) => {
    if (score === 0) return { text: '0 · Normal', cls: 'text-emerald-700 bg-emerald-50' };
    if (score <= 3) return { text: `${score} · Mild`, cls: 'text-emerald-700 bg-emerald-50' };
    if (score <= 6) return { text: `${score} · Moderate`, cls: 'text-amber-800 bg-amber-50' };
    if (score <= 9) return { text: `${score} · Severe`, cls: 'text-rose-700 bg-rose-50' };
    return { text: '10 · Disabled', cls: 'text-rose-900 bg-rose-100 font-bold' };
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-2xs space-y-1.5">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-800">{label}</span>
          <span className="text-[10px] text-slate-400">· {subtitle}</span>
        </div>
        <div className="flex items-center gap-1">
          {currentNum !== null ? (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${getBadge(currentNum).cls}`}>
              {getBadge(currentNum).text}
            </span>
          ) : (
            <span className="text-[10px] text-slate-300 italic">—</span>
          )}
          {value !== '' && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10px] text-slate-400 hover:text-rose-600 px-0.5"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-11 gap-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(String(s))}
            className={`py-1 text-center text-[11px] rounded border transition cursor-pointer ${getPillCls(s)}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── COMPACT 2X2 OUTCOMES MATRIX ──
interface OutcomesMatrixProps {
  functionScore: string;
  moodScore: string;
  sleepScore: string;
  qolScore: string;
  onChangeFunction: (v: string) => void;
  onChangeMood: (v: string) => void;
  onChangeSleep: (v: string) => void;
  onChangeQol: (v: string) => void;
  title?: string;
}

export function OutcomesMatrix({
  functionScore,
  moodScore,
  sleepScore,
  qolScore,
  onChangeFunction,
  onChangeMood,
  onChangeSleep,
  onChangeQol,
  title = 'Outcomes Assessment (0–10)',
}: OutcomesMatrixProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 uppercase tracking-wide text-[11px]">
          {title}
        </span>
        <span className="text-[10px] text-slate-400">
          0 = Normal · 10 = Severe
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ScoreSelector
          label="Function"
          subtitle="Mobility / Activity"
          name="function_score_0_10"
          value={functionScore}
          onChange={onChangeFunction}
        />
        <ScoreSelector
          label="Mood"
          subtitle="Anxiety / Distress"
          name="mood_score_0_10"
          value={moodScore}
          onChange={onChangeMood}
        />
        <ScoreSelector
          label="Sleep"
          subtitle="Insomnia / Night waking"
          name="sleep_score_0_10"
          value={sleepScore}
          onChange={onChangeSleep}
        />
        <ScoreSelector
          label="Quality of Life"
          subtitle="Overall Vitality"
          name="qol_score_0_10"
          value={qolScore}
          onChange={onChangeQol}
        />
      </div>
    </div>
  );
}

// ── NON-INVASIVE MODALITIES LIST ──
const MODALITIES = [
  {
    id: 'prt',
    name: 'PRT (Lin Health)',
    badge: 'Neuroplastic',
    text: '• Pain Reprocessing Therapy (PRT): Somatic tracking & safety reappraisal 10–15 mins daily to desensitize CNS threat alarms without fear.',
    route: '/modalities/prt',
  },
  {
    id: 'graded_pt',
    name: 'Graded PT (Hinge/Kaia)',
    badge: 'Pacing / GET',
    text: '• Psychologically-Informed PT & Graded Exercise: Traffic light pacing (Green safe daily baseline, Yellow challenge). Core stabilizers: bridges, bird-dog 15 mins daily.',
    route: '/modalities/graded-pt',
  },
  {
    id: 'act',
    name: 'ACT for Pain',
    badge: 'Values-Based',
    text: '• Acceptance & Commitment Therapy (ACT): Practice values-based committed action and unhooking from catastrophic pain thoughts.',
    route: '/modalities/act',
  },
  {
    id: 'yoga',
    name: 'CLBP Yoga',
    badge: 'Spine Pacing',
    text: '• Spine-Sparing Yoga for Back Pain: Cat-Cow, Supported Bridge, Elevated-Knee Rest + 4s-6s Pranayama breathing pacer 20 mins 3x/week.',
    route: '/modalities/yoga',
  },
  {
    id: 'cbt_i',
    name: 'CBT-I (Somryst)',
    badge: 'Sleep Drive',
    text: '• CBT-I Sleep-Pain Protocol: Enforce 20-minute stimulus control rule (leave bed if awake & ruminating); consolidate sleep window.',
    route: '/modalities/cbt-i',
  },
];

// ── UNIFIED CLINICAL PLAN DOCK (TABS) ──
interface UnifiedClinicalDockProps {
  currentPlan: string;
  currentNotes: string;
  onAppendPlan: (text: string) => void;
  onAppendNotes: (text: string) => void;
  diagnosisCode?: string;
  diagnosisText?: string;
  painLocation?: string;
}

export function UnifiedClinicalDock({
  currentPlan,
  currentNotes,
  onAppendPlan,
  onAppendNotes,
  diagnosisCode = '',
  diagnosisText = '',
  painLocation = '',
}: UnifiedClinicalDockProps) {
  const [activeTab, setActiveTab] = useState<'regimens' | 'modalities' | 'protocols' | 'phrases' | null>('regimens');
  const [justAddedMsg, setJustAddedMsg] = useState<string | null>(null);

  const matchedProtocol = getManagementProtocol(diagnosisCode, diagnosisText, painLocation);

  const notify = (msg: string) => {
    setJustAddedMsg(msg);
    setTimeout(() => setJustAddedMsg(null), 2500);
  };

  const handleApplyRegimen = (reg: (typeof COMMON_REGIMENS)[0]) => {
    const rxLines = reg.items.map(
      (it) =>
        `• ${it.name} (${it.dosage || 'Std'}) | Dose: ${it.frequency} | Duration: ${it.duration} [${it.instructions}]`
    );
    const separator = currentPlan.trim().length > 0 ? '\n' : '';
    onAppendPlan(`${separator}${rxLines.join('\n')}`);
    if (reg.advice) onAppendNotes(reg.advice);
    notify(`Added ${reg.name} to Plan & Advice`);
  };

  const handleApplyModality = (mod: (typeof MODALITIES)[0]) => {
    const separator = currentPlan.trim().length > 0 ? '\n' : '';
    onAppendPlan(`${separator}${mod.text}`);
    notify(`Added ${mod.name} protocol`);
  };

  const handleApplyProtocol = (text: string, label: string) => {
    onAppendNotes(text);
    notify(`Added ${label} to Advice`);
  };

  const handleApplySmartPhrase = (text: string, label: string) => {
    const separator = currentNotes.trim().length > 0 ? '\n\n' : '';
    onAppendNotes(`${separator}${text}`);
    notify(`Inserted ${label}`);
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
      {/* Sleek Tab Bar Header */}
      <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-2 py-1 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'regimens' ? null : 'regimens')}
            className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'regimens'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>💊</span>
            <span>1-Click Rx</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'modalities' ? null : 'modalities')}
            className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'modalities'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>🌐</span>
            <span>Therapies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'protocols' ? null : 'protocols')}
            className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'protocols'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>📋</span>
            <span>Protocols</span>
            {matchedProtocol && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-teal-100 text-teal-800">
                {matchedProtocol.name.split(' ')[0]}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'phrases' ? null : 'phrases')}
            className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'phrases'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>💬</span>
            <span>Phrases</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(null)}
          className="text-slate-400 hover:text-slate-600 text-[11px] px-1 py-0.5"
          title="Collapse dock"
        >
          {activeTab ? 'Hide ▴' : 'Show ▾'}
        </button>
      </div>

      {/* Dock Content Body */}
      {activeTab && (
        <div className="p-2.5 bg-slate-50/50 space-y-2">
          {/* Tab 1: 1-Click Medication Regimens */}
          {activeTab === 'regimens' && (
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REGIMENS.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => handleApplyRegimen(reg)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-white hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 transition shadow-2xs cursor-pointer flex items-center gap-1"
                  title={`Append ${reg.name} to Plan`}
                >
                  <span className="text-teal-600 font-bold">+</span>
                  <span>{reg.badge}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tab 2: Non-Invasive Digital Modalities */}
          {activeTab === 'modalities' && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {MODALITIES.map((mod) => (
                <div key={mod.id} className="inline-flex items-center rounded-md border border-slate-200 bg-white shadow-2xs overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyModality(mod)}
                    className="px-2 py-1 font-medium text-slate-800 hover:text-teal-900 hover:bg-teal-50 transition cursor-pointer flex items-center gap-1"
                  >
                    <span className="text-teal-600 font-bold">+</span>
                    <span>{mod.name}</span>
                  </button>
                  <Link
                    href={mod.route}
                    target="_blank"
                    className="px-1.5 py-1 bg-slate-50 text-slate-400 hover:text-slate-700 border-l border-slate-200 text-[11px]"
                    title="Open session ↗"
                  >
                    ↗
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Clinical Protocols */}
          {activeTab === 'protocols' && matchedProtocol && (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Guideline: <strong>{matchedProtocol.name}</strong></span>
                <button
                  type="button"
                  onClick={() => handleApplyProtocol(buildCompleteProtocolSummary(matchedProtocol.id), `Full ${matchedProtocol.name} Protocol`)}
                  className="text-teal-700 hover:text-teal-900 underline font-semibold"
                >
                  + Add Complete Protocol
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {matchedProtocol.thermalAdvice?.hotPack && (
                  <button
                    type="button"
                    onClick={() => handleApplyProtocol(`• Moist Heat Therapy: ${matchedProtocol.thermalAdvice.hotPack}`, 'Moist Heat')}
                    className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-teal-300 text-slate-700 text-xs"
                  >
                    + Moist Heat
                  </button>
                )}
                {matchedProtocol.thermalAdvice?.coldPack && (
                  <button
                    type="button"
                    onClick={() => handleApplyProtocol(`• Cold Pack Therapy: ${matchedProtocol.thermalAdvice.coldPack}`, 'Cold Pack')}
                    className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-teal-300 text-slate-700 text-xs"
                  >
                    + Cold Pack
                  </button>
                )}
                {matchedProtocol.physiotherapy?.exercises?.slice(0, 3).map((ex: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyProtocol(`• PT / Exercise: ${ex}`, `Exercise ${idx + 1}`)}
                    className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-teal-300 text-slate-700 text-xs truncate max-w-[220px]"
                    title={ex}
                  >
                    + {ex.split(':')[0]}
                  </button>
                ))}
                {matchedProtocol.nonInvasiveAdvice?.slice(0, 2).map((adv: string, idx: number) => (
                  <button
                    key={`adv-${idx}`}
                    type="button"
                    onClick={() => handleApplyProtocol(`• Ergonomics & Lifestyle: ${adv}`, `Lifestyle Advice`)}
                    className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-teal-300 text-slate-700 text-xs truncate max-w-[220px]"
                    title={adv}
                  >
                    + {adv.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Smart Phrases */}
          {activeTab === 'phrases' && (
            <div className="flex flex-wrap gap-1">
              {SMART_PHRASES.slice(0, 6).map((sp) => (
                <button
                  key={sp.trigger}
                  type="button"
                  onClick={() => handleApplySmartPhrase(sp.text, sp.label)}
                  className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-teal-300 text-slate-700 text-xs font-mono"
                  title={sp.text}
                >
                  <span className="text-teal-600">{sp.trigger}</span> {sp.label}
                </button>
              ))}
            </div>
          )}

          {/* Toast Notification */}
          {justAddedMsg && (
            <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 pt-0.5 animate-fadeIn">
              <span>✓</span>
              <span>{justAddedMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Backward compatibility export
export const PainRegimensBar = UnifiedClinicalDock;
