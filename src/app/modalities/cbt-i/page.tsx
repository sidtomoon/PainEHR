'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CBTIModalitiesPage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'rules' | 'winddown'>('calculator');

  // Calculator inputs
  const [bedtime, setBedtime] = useState('22:30'); // 10:30 PM
  const [sleepLatencyMin, setSleepLatencyMin] = useState(45); // 45 mins to fall asleep
  const [nightWakeMin, setNightWakeMin] = useState(60); // 60 mins awake during night
  const [wakeTime, setWakeTime] = useState('06:30'); // 6:30 AM
  const [outOfBedTime, setOutOfBedTime] = useState('07:15'); // 7:15 AM

  // Wind-down simulator state
  const [windDownStep, setWindDownStep] = useState(0);
  const [copiedRx, setCopiedRx] = useState(false);

  // Compute Time in Bed (TIB) in minutes
  function computeMinutesBetween(start: string, end: string): number {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let mins1 = h1 * 60 + m1;
    let mins2 = h2 * 60 + m2;
    if (mins2 <= mins1) {
      mins2 += 24 * 60; // crossed midnight
    }
    return mins2 - mins1;
  }

  const timeInBedMinutes = computeMinutesBetween(bedtime, outOfBedTime);
  const totalAwakeMinutes = sleepLatencyMin + nightWakeMin + computeMinutesBetween(wakeTime, outOfBedTime);
  const totalSleepMinutes = Math.max(0, timeInBedMinutes - totalAwakeMinutes);
  const sleepEfficiency = timeInBedMinutes > 0 ? Math.round((totalSleepMinutes / timeInBedMinutes) * 100) : 0;

  // Compute Sleep Restriction Prescription
  // Safe floor of 5.5 hours (330 mins)
  const prescribedTIBMinutes = Math.max(330, totalSleepMinutes + 30);
  const prescribedHours = Math.floor(prescribedTIBMinutes / 60);
  const prescribedRemMins = prescribedTIBMinutes % 60;

  // Compute target bedtime based on anchor wake time
  function computeTargetBedtime(wake: string, tibMins: number): string {
    const [h, m] = wake.split(':').map(Number);
    let wakeMins = h * 60 + m;
    let bedMins = wakeMins - tibMins;
    if (bedMins < 0) bedMins += 24 * 60;
    const bedH = Math.floor(bedMins / 60);
    const bedM = bedMins % 60;
    return `${String(bedH).padStart(2, '0')}:${String(bedM).padStart(2, '0')}`;
  }

  const targetBedtime = computeTargetBedtime(wakeTime, prescribedTIBMinutes);

  const windDownPaces = [
    {
      title: 'Phase 1: Digital Curfew & Light Dimming',
      duration: '45 mins before target bedtime',
      action: 'Turn off smartphones, tablets, and bright overhead lights. Ambient amber/warm light triggers natural melatonin release.',
    },
    {
      title: 'Phase 2: Pain Decompression Positioning',
      duration: '30 mins before bed',
      action: 'Lie supine with knees propped over pillows or apply a warm pack to the lumbar area for 15 minutes to reduce paraspinal guarding.',
    },
    {
      title: 'Phase 3: Autonomic Downregulation Breathing',
      duration: '15 mins before bed',
      action: 'Practice 4-7-8 or 4s Inhale / 6s Exhale diaphragmatic breathing. Mentally repeat: "My bed is for resting, not for fixing my pain."',
    },
    {
      title: 'Phase 4: Entering Bed Only When Drowsy',
      duration: 'Target Bedtime',
      action: 'Only climb into bed when eyes feel heavy. If not asleep within 20 minutes, quietly leave the bed.',
    },
  ];

  async function copyRxProtocol() {
    const rxText = `Rx: Cognitive Behavioral Therapy for Insomnia (CBT-I) for Pain Comorbidity (Somryst Model)
- Baseline Sleep Efficiency: ${sleepEfficiency}% (TIB: ${Math.floor(timeInBedMinutes/60)}h ${timeInBedMinutes%60}m, TST: ${Math.floor(totalSleepMinutes/60)}h ${totalSleepMinutes%60}m)
- Prescribed Sleep Restriction Window: ${targetBedtime} to ${wakeTime} (Anchor wake time strictly enforced)
- Stimulus Control: 20-minute bed rule (leave bed if awake & pain-ruminating; return only when sleepy)
- Wind-Down: 45-min digital curfew + diaphragmatic breathing
- Evidence: NIH Consensus / Finan & Smith Meta-Analyses.`;
    await navigator.clipboard.writeText(rxText);
    setCopiedRx(true);
    setTimeout(() => setCopiedRx(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/modalities" className="text-xs text-indigo-700 hover:text-indigo-900 font-medium">
            ← Back to Modalities Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
              Commercial Anchor: Somryst / Sleepio
            </span>
            <button
              onClick={copyRxProtocol}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              {copiedRx ? '✓ Copied Rx' : '📋 Copy CBT-I Prescription'}
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
            <span>Sleep Consolidation &amp; Pain Sensitivity</span>
            <span>·</span>
            <span>Gold Standard Insomnia Care</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            CBT-I for Sleep-Pain Comorbidity
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Pain disrupts sleep, and fragmented sleep dramatically heightens central pain sensitivity the next day.
            Modeled after FDA-authorized prescription digital therapeutics (Somryst), CBT-I rebuilds homeostatic sleep
            drive and eliminates catastrophic nighttime pain conditioning.
          </p>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🧮 Interactive Sleep Efficiency Calculator
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🛌 Stimulus Control &amp; 20-Min Rule
            </button>
            <button
              onClick={() => setActiveTab('winddown')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'winddown'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌙 Bedtime Pain Wind-Down Routine
            </button>
          </div>
        </div>

        {/* TAB 1: Sleep Efficiency Calculator & Sleep Restriction Generator */}
        {activeTab === 'calculator' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Interactive Sleep Efficiency Calculator</h2>
              <p className="text-xs text-slate-500">
                Enter your typical sleep diary values over the last 7 days to calculate Sleep Efficiency (SE%) and generate a therapeutic Sleep Restriction window.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  1. Time Into Bed:
                </label>
                <input
                  type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  2. Minutes to Fall Asleep:
                </label>
                <input
                  type="number" min="0" max="240" step="5" value={sleepLatencyMin}
                  onChange={(e) => setSleepLatencyMin(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  3. Nighttime Awakenings (Mins):
                </label>
                <input
                  type="number" min="0" max="300" step="5" value={nightWakeMin}
                  onChange={(e) => setNightWakeMin(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  4. Final Morning Wake Time:
                </label>
                <input
                  type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  5. Time Out of Bed:
                </label>
                <input
                  type="time" value={outOfBedTime} onChange={(e) => setOutOfBedTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Live Metrics Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Time in Bed (TIB)</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                  {Math.floor(timeInBedMinutes / 60)}h {timeInBedMinutes % 60}m
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Sleep Time (TST)</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                  {Math.floor(totalSleepMinutes / 60)}h {totalSleepMinutes % 60}m
                </p>
              </div>

              <div className={`p-4 border rounded-xl text-center ${
                sleepEfficiency < 85
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="text-[10px] font-bold uppercase opacity-80">Sleep Efficiency (SE%)</span>
                <p className="text-2xl font-bold font-mono mt-0.5">{sleepEfficiency}%</p>
                <span className="text-[10px] font-semibold block">
                  {sleepEfficiency < 85 ? 'Inefficient (Insomnia)' : 'Consolidated Sleep'}
                </span>
              </div>
            </div>

            {/* Generated Sleep Restriction Prescription */}
            <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wide">
                  Prescribed Sleep Restriction Window
                </h3>
              </div>

              <p className="text-xs text-indigo-900 leading-relaxed">
                By spending <strong>{Math.floor(totalAwakeMinutes / 60)}h {totalAwakeMinutes % 60}m</strong> awake in bed tossing and focusing on pain, your brain has conditioned the bed as a cue for frustration and discomfort.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-indigo-200 text-xs text-slate-800">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Strict Target Bedtime:</span>
                  <p className="text-base font-bold text-indigo-900">{targetBedtime}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Anchor Wake-Up Alarm:</span>
                  <p className="text-base font-bold text-indigo-900">{wakeTime} (Strict)</p>
                </div>
              </div>

              <p className="text-[11px] text-indigo-800 italic">
                Rule: Keep the morning wake time constant 7 days a week, regardless of how you slept. This builds homeostatic sleep pressure so that sleep onset becomes rapid and deep.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Stimulus Control Rules & 20-Min Rule */}
        {activeTab === 'rules' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stimulus Control Therapy for Chronic Pain</h2>
              <p className="text-xs text-slate-500">
                Re-conditions the bed as a trigger for rapid, consolidated sleep rather than pain rumination.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="text-base">⏱️</span>
                  <span>1. The 20-Minute Rule</span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  If you are in bed awake for approximately 20 minutes and find your mind caught in pain catastrophizing, <strong>get out of bed</strong>. Go to another dimly lit room, sit in a comfortable chair, and engage in a calm activity (reading or PRT somatic tracking) until genuinely drowsy.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="text-base">🚫</span>
                  <span>2. Bedroom Exclusivity</span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  The bed is strictly for sleep and intimacy. No watching TV, answering work emails, reading news, or lying awake during daytime pain flares in bed.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="text-base">⏰</span>
                  <span>3. Fixed Morning Anchor</span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  Set your alarm for the same time every morning (including weekends). Never compensate for a bad night by sleeping in or taking long naps during the day.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="text-base">🙈</span>
                  <span>4. Hide the Clock</span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  Turn alarm clocks away from view. Watching the clock during pain spikes triggers autonomic cortisol spikes and guarantees sleep fragmentation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Bedtime Pain Wind-Down Routine */}
        {activeTab === 'winddown' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Interactive Bedtime Pain Wind-Down Guide</h2>
              <p className="text-xs text-slate-500">
                A 4-step progressive evening transition designed to downregulate autonomic hyperarousal before entering the bedroom.
              </p>
            </div>

            <div className="space-y-3">
              {windDownPaces.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setWindDownStep(idx)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    windDownStep === idx
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{step.title}</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
