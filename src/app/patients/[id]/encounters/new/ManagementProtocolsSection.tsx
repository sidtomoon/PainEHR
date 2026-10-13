'use client';

import { useState, useMemo } from 'react';
import {
  MANAGEMENT_PROTOCOLS,
  CONSERVATIVE_THERMAL_OPTIONS,
  getManagementProtocol,
  buildCompleteProtocolSummary,
  ManagementProtocol,
} from '@/lib/clinical-decision-rules';

interface ManagementProtocolsSectionProps {
  diagnosisCode?: string;
  diagnosisText?: string;
  painLocation?: string;
  isProcedure?: boolean;
  currentNotes: string;
  onAddAdvice: (text: string) => void;
  onReplaceAdvice?: (text: string) => void;
}

export function ManagementProtocolsSection({
  diagnosisCode = '',
  diagnosisText = '',
  painLocation = '',
  isProcedure = false,
  currentNotes,
  onAddAdvice,
  onReplaceAdvice,
}: ManagementProtocolsSectionProps) {
  // Automatically determine matched protocol based on diagnosis
  const autoMatchedProtocol = useMemo(() => {
    return getManagementProtocol(diagnosisCode, diagnosisText, painLocation, isProcedure);
  }, [diagnosisCode, diagnosisText, painLocation, isProcedure]);

  // Allow manual selection of protocol category if doctor wants to switch
  const [selectedProtocolKey, setSelectedProtocolKey] = useState<string>(autoMatchedProtocol.id);
  const [activeTab, setActiveTab] = useState<'thermal' | 'physio' | 'yoga' | 'lifestyle'>('thermal');
  const [justAddedMsg, setJustAddedMsg] = useState<string | null>(null);

  // Sync selected protocol if diagnosis changes
  const activeProtocol: ManagementProtocol =
    MANAGEMENT_PROTOCOLS[selectedProtocolKey] || autoMatchedProtocol;

  function notifyAdded(label: string) {
    setJustAddedMsg(`Added "${label}" to Advice`);
    setTimeout(() => setJustAddedMsg(null), 2200);
  }

  function handleAppend(text: string, label: string) {
    onAddAdvice(text);
    notifyAdded(label);
  }

  function handleInsertComplete() {
    const summary = buildCompleteProtocolSummary(activeProtocol.id, isProcedure);
    if (onReplaceAdvice && (!currentNotes || currentNotes.trim().length === 0)) {
      onReplaceAdvice(summary);
    } else {
      onAddAdvice(`\n${summary}`);
    }
    notifyAdded(`Complete ${activeProtocol.name} Protocol`);
  }

  return (
    <div className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50 border border-teal-200 rounded-xl p-4 shadow-2xs space-y-4 my-3">
      {/* Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🩺</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                Non-Invasive, Conservative &amp; Rehab Management
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Evidence-Based
              </span>
            </div>
            <p className="text-[11px] text-teal-800 mt-0.5">
              Click any chip to append directly into patient&apos;s prescription advice
            </p>
          </div>
        </div>

        {/* Protocol Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <label className="text-[11px] font-semibold text-slate-600">Protocol:</label>
          <select
            value={activeProtocol.id}
            onChange={(e) => setSelectedProtocolKey(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-white border border-teal-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {Object.values(MANAGEMENT_PROTOCOLS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Add Notification */}
      {justAddedMsg && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs px-3 py-1.5 rounded-lg flex items-center justify-between animate-fadeIn">
          <span className="font-semibold">✓ {justAddedMsg}</span>
          <span className="text-[10px] text-emerald-700">Appended to Notes &amp; Rx</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('thermal')}
          className={`px-3 py-1 rounded-md transition font-semibold ${
            activeTab === 'thermal'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🧊 Thermal / Conservative
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('physio')}
          className={`px-3 py-1 rounded-md transition font-semibold ${
            activeTab === 'physio'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🏃 Physiotherapy &amp; Exercises
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('yoga')}
          className={`px-3 py-1 rounded-md transition font-semibold ${
            activeTab === 'yoga'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🧘 Yoga &amp; Mind-Body
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lifestyle')}
          className={`px-3 py-1 rounded-md transition font-semibold ${
            activeTab === 'lifestyle'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📐 Ergonomics &amp; Lifestyle
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={handleInsertComplete}
            className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1 rounded-md shadow-2xs transition flex items-center gap-1 cursor-pointer"
          >
            <span>⚡ Insert Full Protocol</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: 1. Thermal Modalities */}
      {activeTab === 'thermal' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Conservative Thermal Modalities:
            </span>
            <span className="text-[11px] text-slate-500">Tap to add into Advice</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONSERVATIVE_THERMAL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAppend(opt.text, opt.shortLabel)}
                className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/60 hover:border-teal-300 transition group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                    + {opt.label}
                  </span>
                  <span className="text-[10px] text-teal-600 font-mono bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                    {opt.shortLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">{opt.text}</p>
              </button>
            ))}
          </div>

          {/* Condition-specific thermal advice */}
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Diagnosis-Specific Thermal Guidance:</span>
            <ul className="mt-1 space-y-1 text-slate-600 text-[11px]">
              <li>• <strong className="text-slate-800">Hot pack:</strong> {activeProtocol.thermalAdvice.hotPack}</li>
              <li>• <strong className="text-slate-800">Cold pack:</strong> {activeProtocol.thermalAdvice.coldPack}</li>
              {activeProtocol.thermalAdvice.coldPackPostProcedure && (
                <li>• <strong className="text-teal-800">Post-Procedure:</strong> {activeProtocol.thermalAdvice.coldPackPostProcedure}</li>
              )}
              <li>• <strong className="text-slate-800">Alternate contrast:</strong> {activeProtocol.thermalAdvice.alternateContrast}</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Physiotherapy & Exercises */}
      {activeTab === 'physio' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Physiotherapy: {activeProtocol.physiotherapy.protocolName}
              </span>
              <p className="text-[11px] text-slate-500">Tailored to {activeProtocol.name}</p>
            </div>
          </div>

          {/* Precautions / Avoidance (e.g. Avoid squatting for Knee OA) */}
          {activeProtocol.physiotherapy.precautions.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wide">
                ⚠️ Critical Movement Precautions &amp; Avoidance:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeProtocol.physiotherapy.precautions.map((prec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppend(`⚠️ Precaution: ${prec}`, 'Precaution')}
                    className="text-left text-xs bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 hover:border-rose-400 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer shadow-2xs"
                  >
                    + {prec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700">Specific Exercises:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeProtocol.physiotherapy.exercises.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppend(`• Physio: ${ex}`, 'Physio Exercise')}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/70 hover:border-teal-300 text-xs font-medium text-slate-800 transition cursor-pointer shadow-2xs group"
                >
                  <span className="text-teal-700 font-bold mr-1 group-hover:text-teal-900">+</span>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Yoga & Mind-Body */}
      {activeTab === 'yoga' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Evidence-Based Yoga Asanas &amp; Pranayama:
            </span>
            <span className="text-[11px] text-slate-500">Tap to add into Advice</span>
          </div>

          {/* Yoga Precautions */}
          {activeProtocol.yoga.precautions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                ⚠️ Yoga Contraindications for {activeProtocol.name}:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {activeProtocol.yoga.precautions.map((prec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppend(`⚠️ Yoga Contraindication: ${prec}`, 'Yoga Precaution')}
                    className="text-left text-xs bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer"
                  >
                    + {prec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Asanas */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700">Recommended Asanas:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeProtocol.yoga.asanas.map((asana, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppend(`• Yoga Asana: ${asana}`, 'Yoga Asana')}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/70 hover:border-teal-300 text-xs font-medium text-slate-800 transition cursor-pointer shadow-2xs group"
                >
                  <span className="text-teal-700 font-bold mr-1 group-hover:text-teal-900">+</span>
                  {asana}
                </button>
              ))}
            </div>
          </div>

          {/* Pranayama */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-slate-700">Pranayama / Breathing:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeProtocol.yoga.pranayama.map((prana, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppend(`• Pranayama: ${prana}`, 'Pranayama')}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/70 hover:border-teal-300 text-xs font-medium text-slate-800 transition cursor-pointer shadow-2xs"
                >
                  <span className="text-teal-700 font-bold mr-1">+</span>
                  {prana}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Ergonomics & Lifestyle */}
      {activeTab === 'lifestyle' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Evidence-Based Non-Invasive Lifestyle &amp; Ergonomic Advice:
            </span>
            <span className="text-[11px] text-slate-500">Tap to add into Advice</span>
          </div>

          <div className="space-y-2">
            {activeProtocol.nonInvasiveAdvice.map((adv, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAppend(`• Advice: ${adv}`, 'Non-Invasive Advice')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/70 hover:border-teal-300 text-xs font-medium text-slate-800 transition cursor-pointer shadow-2xs group flex items-start gap-2"
              >
                <span className="text-teal-700 font-bold mt-0.5 group-hover:text-teal-900">+</span>
                <span>{adv}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
