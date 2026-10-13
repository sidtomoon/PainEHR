'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Exercise {
  id: string;
  name: string;
  duration: number; // in seconds
  repsText: string;
  instructions: string;
  psychologicalCue: string;
  focusArea: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 'pelvic_tilts',
    name: 'Pelvic Tilts (Neutral Spine Finding)',
    duration: 30,
    repsText: '8–10 gentle cycles',
    instructions: 'Lie on your back with knees bent. Gently flatten your lower back against the mat by tightening your abdomen, then relax into a subtle natural arch.',
    psychologicalCue: 'Notice how your lumbar spine can move fluidly without threat. Hurt does not equal damage.',
    focusArea: 'Lumbar-pelvic rhythm & segmental mobility',
  },
  {
    id: 'cat_cow',
    name: 'Spine-Sparing Cat-Cow Mobilization',
    duration: 35,
    repsText: '6–8 slow breath-linked reps',
    instructions: 'On hands and knees, slowly inhale as you let your chest open gently. Exhale as you round your upper back smoothly without forcing end-range flexion.',
    psychologicalCue: 'Your spinal joints are designed for multi-planar movement. Fluid motion nourishes intervertebral discs.',
    focusArea: 'Thoracolumbar segmental nutrition',
  },
  {
    id: 'glute_bridge',
    name: 'Supported Glute Bridge',
    duration: 30,
    repsText: '6 holds of 3–5 seconds',
    instructions: 'Press through your heels and lift your hips until your thighs and torso align. Squeeze your glutes at the top without hyperextending your lumbar spine.',
    psychologicalCue: 'Feel your glutes powering the movement. Strong hip extensors relieve chronic lumbar fatigue.',
    focusArea: 'Posterior chain recruitment & lumbar unloading',
  },
  {
    id: 'bird_dog',
    name: 'Contralateral Bird-Dog Reach',
    duration: 40,
    repsText: '4 reps per side',
    instructions: 'From tabletop position, extend your right arm forward and left leg straight back. Hold 2 seconds, maintaining a level pelvis, then switch smoothly.',
    psychologicalCue: 'Symmetrical core activation creates a natural internal back brace. Trust your body’s stability.',
    focusArea: 'Multifidus & deep core stabilizing sling',
  },
];

export default function GradedPTPage() {
  const [activeTab, setActiveTab] = useState<'routine' | 'pacing'>('routine');

  // Exercise player state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXERCISES[0].duration);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fear-Avoidance Screener state
  const [kinesiophobiaScore, setKinesiophobiaScore] = useState(3);
  const [copiedRx, setCopiedRx] = useState(false);

  useEffect(() => {
    setTimeLeft(EXERCISES[currentIdx].duration);
    setIsPlaying(false);
  }, [currentIdx]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      if (currentIdx < EXERCISES.length - 1) {
        setCurrentIdx((i) => i + 1);
      } else {
        setIsPlaying(false);
        setCompleted(true);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timeLeft, currentIdx]);

  function togglePlay() {
    setIsPlaying(!isPlaying);
  }

  function resetRoutine() {
    setIsPlaying(false);
    setCurrentIdx(0);
    setTimeLeft(EXERCISES[0].duration);
    setCompleted(false);
  }

  async function copyRxProtocol() {
    const rxText = `Rx: Psychologically-Informed PT & Graded Exercise (Hinge/Kaia Model)
- Movement Pacing: Traffic Light protocol (Green zone baseline, Yellow zone safe challenge).
- Core Sequence: Pelvic tilts, Cat-Cow, Glute bridges, Bird-dog stabilizers.
- Frequency: 15 minutes daily.
- Psychological Principle: Hurt does not equal harm. Avoid boom-bust cycles; maintain consistent daily movement.
- Evidence: NICE Guidelines NG193 / Cochrane Review.`;
    await navigator.clipboard.writeText(rxText);
    setCopiedRx(true);
    setTimeout(() => setCopiedRx(false), 2500);
  }

  const currentExercise = EXERCISES[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/modalities" className="text-xs text-blue-700 hover:text-blue-900 font-medium">
            ← Back to Modalities Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              Commercial Anchor: Hinge &amp; Kaia Health
            </span>
            <button
              onClick={copyRxProtocol}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              {copiedRx ? '✓ Copied Rx' : '📋 Copy Graded PT Prescription'}
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">
            <span>Biomechanical &amp; Cognitive Rehabilitation</span>
            <span>·</span>
            <span>NICE NG193 Standard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Psychologically-Informed PT &amp; Graded Exercise
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The core architecture of commercial MSK platforms (Hinge Health, Kaia Health). Combines progressive spinal mobilization with cognitive reassurance to break the kinesiophobia boom-and-bust cycle.
          </p>

          {/* Tab Switcher */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('routine')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'routine'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏃 Interactive Guided Exercise Player
            </button>
            <button
              onClick={() => setActiveTab('pacing')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'pacing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🚦 Traffic Light Movement Pacing Planner
            </button>
          </div>
        </div>

        {/* TAB 1: Interactive Guided Exercise Player */}
        {activeTab === 'routine' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
            {!completed ? (
              <>
                {/* Exercise Progress Indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Exercise {currentIdx + 1} of {EXERCISES.length}
                  </span>
                  <div className="flex gap-1.5">
                    {EXERCISES.map((ex, i) => (
                      <span
                        key={ex.id}
                        className={`w-6 h-1.5 rounded-full ${
                          i === currentIdx
                            ? 'bg-blue-600'
                            : i < currentIdx
                            ? 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Active Exercise Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{currentExercise.name}</h2>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {currentExercise.repsText}
                      </span>
                    </div>

                    {/* Timer Display */}
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center shadow-xs">
                        <span className="font-mono text-xl font-bold text-slate-900">{timeLeft}s</span>
                      </div>
                      <button
                        onClick={togglePlay}
                        className={`text-xs px-4 py-2.5 rounded-lg font-bold text-white shadow-sm transition cursor-pointer ${
                          isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isPlaying ? '⏸ Pause' : '▶ Start Timer'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mb-3">
                    <strong>Instructions:</strong> {currentExercise.instructions}
                  </p>

                  {/* Psychologically-Informed Cue (Hinge/Kaia style) */}
                  <div className="bg-blue-900 text-white rounded-lg p-3 text-xs flex items-start gap-2 shadow-xs">
                    <span className="text-base">💡</span>
                    <div>
                      <span className="font-bold text-blue-300 block uppercase text-[10px] tracking-wider">
                        Reassurance &amp; Cognitive Cue:
                      </span>
                      <span className="italic">{currentExercise.psychologicalCue}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 font-semibold cursor-pointer"
                  >
                    ← Previous Exercise
                  </button>

                  <button
                    onClick={() => {
                      if (currentIdx < EXERCISES.length - 1) {
                        setCurrentIdx((i) => i + 1);
                      } else {
                        setCompleted(true);
                      }
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition"
                  >
                    {currentIdx < EXERCISES.length - 1 ? 'Next Exercise →' : 'Finish Routine ✓'}
                  </button>
                </div>
              </>
            ) : (
              /* Routine Completed State */
              <div className="text-center py-8 bg-emerald-50 rounded-xl border border-emerald-200 p-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                  🏆
                </div>
                <h2 className="text-xl font-bold text-emerald-900">Graded Movement Session Completed!</h2>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Congratulations. You completed all 4 foundational movements without triggering acute guarding. Consistency builds tissue resilience.
                </p>

                <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs text-slate-700 max-w-md mx-auto text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Movements:</span>
                    <span className="font-bold">4 Exercises (Pelvic tilts, Cat-Cow, Bridges, Bird-Dog)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pacing Recommendation:</span>
                    <span className="font-bold text-emerald-700">Daily 15-minute maintenance</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={resetRoutine}
                    className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Restart Routine
                  </button>
                  <button
                    onClick={() => setActiveTab('pacing')}
                    className="text-xs bg-white text-emerald-800 border border-emerald-300 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-50 cursor-pointer"
                  >
                    View Traffic Light Pacing Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Traffic Light Movement Pacing Planner */}
        {activeTab === 'pacing' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Traffic Light Movement Pacing System</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Teaches patients how to pace physical activity and avoid the devastating &ldquo;boom-and-bust&rdquo; cycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Green Zone */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <h3 className="font-bold text-sm text-emerald-900">🟢 Green Zone: Baseline</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 block">Safe Daily Movement</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Activities that can be performed every day regardless of pain. E.g. 15-minute walk, pelvic tilts, light stretches.
                </p>
                <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-800 font-medium">
                  Rule: Do not skip on good days; do not abandon on bad days.
                </div>
              </div>

              {/* Yellow Zone */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <h3 className="font-bold text-sm text-amber-900">🟡 Yellow Zone: Challenge</h3>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 block">&ldquo;Hurt ≠ Harm&rdquo; Window</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Mild increase in discomfort (NRS ≤ 4/10) that settles within 24 hours. E.g. introducing light resistance or 5 extra minutes of walking.
                </p>
                <div className="pt-2 border-t border-amber-200 text-[11px] text-amber-800 font-medium">
                  Rule: Stay calm; this expands your neurological envelope.
                </div>
              </div>

              {/* Red Zone */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <h3 className="font-bold text-sm text-rose-900">🔴 Red Zone: Acute Flare</h3>
                </div>
                <span className="text-[11px] font-semibold text-rose-800 block">De-Escalation Plan</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Sudden severe spike in pain. Revert to decompression positions (supine with legs elevated), diaphragmatic breathing, and PRT safety cues.
                </p>
                <div className="pt-2 border-t border-rose-200 text-[11px] text-rose-800 font-medium">
                  Rule: Do NOT commit to prolonged bed rest; keep walking gently.
                </div>
              </div>
            </div>

            {/* Fear-Avoidance Belief Scale */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Kinesiophobia / Fear of Movement Level:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">{kinesiophobiaScore} / 5</span>
              </div>
              <input
                type="range" min="1" max="5" value={kinesiophobiaScore}
                onChange={(e) => setKinesiophobiaScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 - Minimal Fear of Movement</span>
                <span>3 - Moderate Guarding</span>
                <span>5 - Severe Avoidance / Catastrophizing</span>
              </div>
              {kinesiophobiaScore >= 3 && (
                <p className="text-[11px] text-amber-800 pt-1 font-medium">
                  ⚠️ Patient exhibits significant movement guarding. Emphasize Yellow Zone pacing and cognitive reassurance during each consultation.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
