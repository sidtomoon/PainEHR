'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PRTPage() {
  // Screener state (FIT criteria)
  const [screenerAnswers, setScreenerAnswers] = useState<Record<string, boolean>>({
    noDeficit: false,
    stressTrigger: false,
    variableIntensity: false,
    anticipationTriggers: false,
    multiSite: false,
    delayedOnset: false,
  });

  // Somatic Tracking session state
  const [sessionStep, setSessionStep] = useState<'idle' | 'pre' | 'grounding' | 'curiosity' | 'reappraisal' | 'post' | 'completed'>('idle');
  const [preThreat, setPreThreat] = useState(7);
  const [postThreat, setPostThreat] = useState(4);
  const [selectedDescriptors, setSelectedDescriptors] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [copiedRx, setCopiedRx] = useState(false);

  const fitQuestions = [
    { key: 'noDeficit', label: 'Absence of progressive neurological deficit or red-flag structural emergency' },
    { key: 'stressTrigger', label: 'Pain originated or flares during periods of elevated life stress or anxiety' },
    { key: 'variableIntensity', label: 'Pain intensity varies unpredictably across different days or environments' },
    { key: 'anticipationTriggers', label: 'Anticipation or fear of a movement triggers pain before the movement happens' },
    { key: 'multiSite', label: 'Pain symptoms have migrated or exist in multiple non-contiguous body sites' },
    { key: 'delayedOnset', label: 'Pain onset is delayed (e.g. flares hours after an activity rather than during)' },
  ];

  const fitScore = Object.values(screenerAnswers).filter(Boolean).length;

  const descriptorsList = [
    'Tingling', 'Buzzing', 'Warmth / Heat', 'Tightness', 'Pressure',
    'Dull heaviness', 'Vibration', 'Aching', 'Pulsing', 'Numb sensation',
  ];

  function toggleDescriptor(desc: string) {
    if (selectedDescriptors.includes(desc)) {
      setSelectedDescriptors(selectedDescriptors.filter((d) => d !== desc));
    } else {
      setSelectedDescriptors([...selectedDescriptors, desc]);
    }
  }

  async function copyRxProtocol() {
    const rxText = `Rx: Pain Reprocessing Therapy (PRT) Protocol (Lin Health Model)
- Modality: Daily Somatic Tracking & Safety Reappraisal
- Frequency: 10-15 minutes, 1-2 times daily
- Core Skill: Curiosity-driven sensation observation without catastrophic fear. Treat pain as a false danger signal from an over-sensitized central nervous system.
- Evidence: JAMA Psychiatry Boulder Back Pain Trial (Ashar et al.)`;
    await navigator.clipboard.writeText(rxText);
    setCopiedRx(true);
    setTimeout(() => setCopiedRx(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/modalities" className="text-xs text-teal-700 hover:text-teal-900 font-medium">
            ← Back to Modalities Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
              Commercial Anchor: Lin Health
            </span>
            <button
              onClick={copyRxProtocol}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              {copiedRx ? '✓ Copied Rx' : '📋 Copy PRT Prescription'}
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wide">
            <span>Neuroplastic Retraining</span>
            <span>·</span>
            <span>JAMA Psychiatry 2022</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Pain Reprocessing Therapy (PRT)
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Pain Reprocessing Therapy teaches the brain to recalibrate danger signals. Grounded in the Boulder Back Pain
            trial (66% pain-free at 1 year), PRT shifts sensation appraisal from a catastrophic physical alarm to a benign
            neuroplastic signal.
          </p>
        </div>

        {/* Module 1: FIT Neuroplastic Pain Screener */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Neuroplastic vs. Structural Screener</h2>
              <p className="text-xs text-slate-500">Based on FIT (Functional Inconsistency &amp; Threat) diagnostic criteria</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-1 rounded border ${fitScore >= 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                Score: {fitScore} / 6
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {fitQuestions.map((q) => (
              <label
                key={q.key}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition text-xs"
              >
                <input
                  type="checkbox"
                  checked={screenerAnswers[q.key]}
                  onChange={(e) => setScreenerAnswers({ ...screenerAnswers, [q.key]: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-800 font-medium">{q.label}</span>
              </label>
            ))}
          </div>

          {fitScore >= 3 ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <span>🎯</span>
              <span>
                <strong>Strong Neuroplastic / Centralized Component:</strong> Patient shows functional inconsistencies and threat-mediated pain. High responder profile for PRT Somatic Tracking.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              Check all features that apply. Scores ≥ 3 indicate a primary centralized/neuroplastic mechanism.
            </div>
          )}
        </div>

        {/* Module 2: Interactive Somatic Tracking Simulator (Lin Health Model) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Interactive Clinical Exercise</span>
              <h2 className="text-lg font-bold text-slate-900">2. Somatic Tracking Simulator</h2>
              <p className="text-xs text-slate-500">Guide patient to observe sensation with neutral curiosity, stripping fear-threat valence.</p>
            </div>
            {sessionStep !== 'idle' && (
              <button
                onClick={() => setSessionStep('idle')}
                className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Reset Session
              </button>
            )}
          </div>

          {/* STEP 0: Idle State */}
          {sessionStep === 'idle' && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto text-xl mb-3">
                🧠
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Start an Interactive Somatic Tracking Session</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                This takes 3–5 minutes. We measure threat level before and after, guide sensation exploration without fear, and deliver positive safety reappraisals.
              </p>
              <button
                onClick={() => setSessionStep('pre')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                Begin Somatic Tracking Session →
              </button>
            </div>
          )}

          {/* STEP 1: Pre-Session Threat Meter */}
          {sessionStep === 'pre' && (
            <div className="space-y-4 py-3">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-900">
                <strong>Step 1: Baseline Threat Check</strong> — How dangerous, distressing, or alarming does this sensation feel right now in your mind?
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-2 text-xs font-bold">
                  <span>Threat Level:</span>
                  <span className="text-base text-teal-700 font-mono">{preThreat} / 10</span>
                </div>
                <input
                  type="range" min="0" max="10" value={preThreat}
                  onChange={(e) => setPreThreat(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 - Completely Safe &amp; Benign</span>
                  <span>5 - Moderately Alarming</span>
                  <span>10 - Severe Perceived Danger</span>
                </div>
              </div>

              <button
                onClick={() => setSessionStep('grounding')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
              >
                Next: Grounding &amp; Sensation Settling →
              </button>
            </div>
          )}

          {/* STEP 2: Grounding & Settling */}
          {sessionStep === 'grounding' && (
            <div className="space-y-4 py-3 text-center">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-xs text-teal-900 max-w-lg mx-auto">
                <p className="font-semibold text-sm mb-1">🌿 Settle &amp; Anchor</p>
                <p>
                  Sit upright comfortably. Allow your shoulders to drop. Let your belly soften with each exhale.
                  Remind yourself: <em>&ldquo;These physical sensations are loud, but they are not dangerous.&rdquo;</em>
                </p>
              </div>

              <div className="py-4">
                <div className="w-20 h-20 rounded-full bg-teal-100/70 border-4 border-teal-500 animate-pulse flex items-center justify-center mx-auto text-xs font-bold text-teal-900">
                  Breathe
                </div>
                <p className="text-xs text-slate-500 mt-2">Take 3 calm, slow breaths into your diaphragm.</p>
              </div>

              <button
                onClick={() => setSessionStep('curiosity')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition cursor-pointer"
              >
                Next: Sensation Explorer →
              </button>
            </div>
          )}

          {/* STEP 3: Sensation Explorer (Objective Curiosity) */}
          {sessionStep === 'curiosity' && (
            <div className="space-y-4 py-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                <strong>Step 2: Sensation Explorer</strong> — Focus on the exact bodily sensation with the mind of a scientist. Select the neutral sensory words that describe what you feel right now:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {descriptorsList.map((desc) => (
                  <button
                    key={desc}
                    type="button"
                    onClick={() => toggleDescriptor(desc)}
                    className={`text-xs px-3 py-2 rounded-lg border font-medium transition cursor-pointer ${
                      selectedDescriptors.includes(desc)
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {desc}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                💡 <strong>Clinical Tip:</strong> Notice that you are feeling <em>&ldquo;{selectedDescriptors.join(', ') || 'sensation'}&rdquo;</em>, rather than &ldquo;tissue tearing&rdquo;. Sensation without fear removes the neurological fuel.
              </div>

              <button
                onClick={() => setSessionStep('reappraisal')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
              >
                Next: Cognitive Safety Reappraisal →
              </button>
            </div>
          )}

          {/* STEP 4: Safety Reappraisal Affirmations */}
          {sessionStep === 'reappraisal' && (
            <div className="space-y-4 py-3">
              <div className="bg-teal-900 text-white rounded-xl p-5 text-center space-y-3 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300">Safety Reappraisal Cue</span>
                <p className="text-base sm:text-lg font-semibold italic max-w-lg mx-auto">
                  &ldquo;My brain is misinterpreting safe nerve signals as a threat. The alarm is loud, but my body is physically safe and intact.&rdquo;
                </p>
                <p className="text-xs text-teal-200 max-w-md mx-auto">
                  By staying calm while feeling this sensation, you are rewiring the neural circuits in your insular and somatosensory cortex.
                </p>
              </div>

              <button
                onClick={() => setSessionStep('post')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
              >
                Next: Post-Session Threat Check →
              </button>
            </div>
          )}

          {/* STEP 5: Post-Session Threat Meter */}
          {sessionStep === 'post' && (
            <div className="space-y-4 py-3">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-900">
                <strong>Step 4: Post-Session Threat Check</strong> — How dangerous or threatening does the sensation feel right now after Somatic Tracking?
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-2 text-xs font-bold">
                  <span>Current Threat Level:</span>
                  <span className="text-base text-teal-700 font-mono">{postThreat} / 10</span>
                </div>
                <input
                  type="range" min="0" max="10" value={postThreat}
                  onChange={(e) => setPostThreat(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 - Calm / No Threat</span>
                  <span>5 - Moderate</span>
                  <span>10 - High Threat</span>
                </div>
              </div>

              <button
                onClick={() => setSessionStep('completed')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
              >
                Complete Session &amp; View Results →
              </button>
            </div>
          )}

          {/* STEP 6: Session Completed Summary */}
          {sessionStep === 'completed' && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 font-bold text-sm">🎉 Somatic Tracking Session Complete!</span>
                  <p className="text-xs text-emerald-700 mt-0.5">Neuroplastic safety pathways were successfully engaged.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-1 rounded">
                    Threat Delta: {preThreat} → {postThreat} ({postThreat < preThreat ? `-${preThreat - postThreat} pts` : 'Stable'})
                  </span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-emerald-200 text-xs text-slate-700 space-y-2">
                <p>
                  <strong>Clinical Note:</strong> The patient observed somatic sensations ({selectedDescriptors.join(', ') || 'somatic input'}) with curious non-judgment and completed active safety reappraisal.
                </p>
                <p className="text-slate-500">
                  Recommended frequency: Practice this 10-minute sequence 1–2 times daily, especially whenever anticipating or experiencing a symptom flare.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSessionStep('idle')}
                  className="text-xs bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 cursor-pointer"
                >
                  Start New Session
                </button>
                <Link
                  href="/modalities"
                  className="text-xs bg-white text-emerald-800 border border-emerald-300 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-50"
                >
                  Explore Other Modalities
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
