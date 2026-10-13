'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface YogaPose {
  id: string;
  sanskrit: string;
  english: string;
  duration: number; // in seconds
  cues: string[];
  breathingCue: string;
  spineSafety: string;
  suitableFor: ('flexion_intolerant' | 'extension_intolerant' | 'neutral')[];
}

const YOGA_POSES: YogaPose[] = [
  {
    id: 'cat_cow',
    sanskrit: 'Marjaryasana-Bitilasana',
    english: 'Breath-Synchronized Cat-Cow',
    duration: 40,
    cues: [
      'Begin on hands and knees with wrists under shoulders, knees under hips.',
      'Inhale: Softly lift the chest forward into a mild arch.',
      'Exhale: Draw navel toward spine, rounding gently through the upper back.',
    ],
    breathingCue: 'Inhale to open the chest, Exhale to round gently. Smooth, fluid rhythm.',
    spineSafety: 'Keep movements well inside pain-free range. Avoid forcing deep lumbar extension.',
    suitableFor: ['flexion_intolerant', 'extension_intolerant', 'neutral'],
  },
  {
    id: 'sphinx',
    sanskrit: 'Salamba Bhujangasana',
    english: 'Supported Sphinx Pose',
    duration: 45,
    cues: [
      'Lie prone on your stomach, resting on forearms with elbows directly under shoulders.',
      'Press forearms gently downward, drawing shoulders away from ears.',
      'Relax the lower back and glutes completely, allowing natural lumbar curve.',
    ],
    breathingCue: 'Deep diaphragmatic breaths into your abdomen against the floor.',
    spineSafety: 'Ideal for discogenic/flexion-intolerant back pain. If facet pain flares, lower chest to floor.',
    suitableFor: ['flexion_intolerant', 'neutral'],
  },
  {
    id: 'knee_to_chest',
    sanskrit: 'Apanasana',
    english: 'Supine Single Knee-to-Chest',
    duration: 40,
    cues: [
      'Lie flat on back. Bring one knee gently toward your ribs, clasping hands behind the thigh.',
      'Keep the opposite knee bent with foot flat to stabilize the pelvis.',
      'Hold 20 seconds per side without pulling aggressively.',
    ],
    breathingCue: 'Exhale as you draw the knee in; inhale as you release slightly.',
    spineSafety: 'Relieves facet and canal stenosis pressure by opening intervertebral foramina.',
    suitableFor: ['extension_intolerant', 'neutral'],
  },
  {
    id: 'supported_bridge',
    sanskrit: 'Setu Bandha Sarvangasana',
    english: 'Supported Pelvic Bridge',
    duration: 45,
    cues: [
      'Lie on your back, knees bent, feet hip-width apart and flat on the mat.',
      'Optionally place a yoga block or cushion under the sacrum for passive support.',
      'Engage glutes softly to keep pelvis level. Arms resting by your sides.',
    ],
    breathingCue: 'Breathe evenly into the ribcage, feeling the chest expand.',
    spineSafety: 'Neutral lumbar posture. Avoid high arching; prioritize pelvic stability.',
    suitableFor: ['flexion_intolerant', 'extension_intolerant', 'neutral'],
  },
  {
    id: 'savasana',
    sanskrit: 'Savasana with Bolster',
    english: 'Elevated-Knee Rest & Integration',
    duration: 60,
    cues: [
      'Lie supine with a rolled bolster or pillows under your knees.',
      'Allow your feet to fall open naturally, arms relaxed beside you with palms facing up.',
      'Close eyes and surrender all muscle tension into the floor.',
    ],
    breathingCue: 'Lengthen your exhale to activate vagal tone and downregulate the nervous system.',
    spineSafety: 'Knee elevation unloads the iliopsoas muscle, completely flattening lumbar shear stress.',
    suitableFor: ['flexion_intolerant', 'extension_intolerant', 'neutral'],
  },
];

export default function YogaPage() {
  const [directionalPreference, setDirectionalPreference] = useState<'neutral' | 'flexion_intolerant' | 'extension_intolerant'>('neutral');
  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(YOGA_POSES[0].duration);
  const [isCompleted, setIsCompleted] = useState(false);

  // Breathing pacer: 'inhale' (4s), 'hold' (2s), 'exhale' (6s)
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [copiedRx, setCopiedRx] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathRef = useRef<NodeJS.Timeout | null>(null);

  // Filter poses based on directional preference
  const filteredPoses = YOGA_POSES.filter((p) => p.suitableFor.includes(directionalPreference));
  const currentPose = filteredPoses[currentPoseIdx] || filteredPoses[0];

  useEffect(() => {
    if (currentPose) {
      setTimerSeconds(currentPose.duration);
    }
  }, [currentPoseIdx, directionalPreference]);

  // Main pose timer
  useEffect(() => {
    if (isPlaying && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds((t) => t - 1);
      }, 1000);
    } else if (isPlaying && timerSeconds === 0) {
      if (currentPoseIdx < filteredPoses.length - 1) {
        setCurrentPoseIdx((i) => i + 1);
      } else {
        setIsPlaying(false);
        setIsCompleted(true);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timerSeconds, currentPoseIdx, filteredPoses.length]);

  // Pranayama breathing loop (Inhale 4s -> Hold 2s -> Exhale 6s)
  useEffect(() => {
    breathRef.current = setInterval(() => {
      setBreathSeconds((prev) => {
        if (prev <= 1) {
          setBreathPhase((phase) => {
            if (phase === 'Inhale') return 'Hold';
            if (phase === 'Hold') return 'Exhale';
            return 'Inhale';
          });
          return breathPhase === 'Inhale' ? 2 : breathPhase === 'Hold' ? 6 : 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breathRef.current) clearInterval(breathRef.current);
    };
  }, [breathPhase]);

  async function copyRxProtocol() {
    const rxText = `Rx: Evidence-Based Yoga Protocol for Chronic Low Back Pain (Saper et al. Annals Int Med)
- Directional Profile: ${directionalPreference.replace(/_/g, ' ').toUpperCase()}
- Recommended Routine: 5-pose spine-sparing sequence (Cat-Cow, Sphinx/Bridge, Supported Savasana)
- Frequency: 20-25 minutes, 3 times per week
- Breathing: 4s inhale / 6s prolonged exhale pranayama to downregulate sympathetic hyperarousal.
- Safety: Stop before sharp pain; maintain neutral lumbar spine.`;
    await navigator.clipboard.writeText(rxText);
    setCopiedRx(true);
    setTimeout(() => setCopiedRx(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/modalities" className="text-xs text-emerald-800 hover:text-emerald-900 font-medium">
            ← Back to Modalities Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Annals of Internal Medicine Protocol
            </span>
            <button
              onClick={copyRxProtocol}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              {copiedRx ? '✓ Copied Rx' : '📋 Copy Yoga Prescription'}
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wide">
            <span>Mind-Body Spine Rehabilitation</span>
            <span>·</span>
            <span>Saper et al. NIH Trial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Yoga for Chronic Low Back Pain
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Standardized, spine-sparing asanas designed to restore multi-segmental spinal nutrition while calming central autonomic hyperarousal via structured pranayama breathing.
          </p>

          {/* Directional Preference Selector */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Select Patient’s Directional Bias / Pain Profile:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDirectionalPreference('neutral');
                  setCurrentPoseIdx(0);
                  setIsCompleted(false);
                }}
                className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                  directionalPreference === 'neutral'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block font-bold">General / Non-Specific CLBP</span>
                <span className="text-[11px] text-slate-500">Balanced mobility and relaxation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirectionalPreference('flexion_intolerant');
                  setCurrentPoseIdx(0);
                  setIsCompleted(false);
                }}
                className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                  directionalPreference === 'flexion_intolerant'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block font-bold">Flexion-Intolerant (Discogenic)</span>
                <span className="text-[11px] text-slate-500">Avoid bending forward; favor Sphinx &amp; extension</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirectionalPreference('extension_intolerant');
                  setCurrentPoseIdx(0);
                  setIsCompleted(false);
                }}
                className={`p-2.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                  directionalPreference === 'extension_intolerant'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block font-bold">Extension-Intolerant (Facet/Stenosis)</span>
                <span className="text-[11px] text-slate-500">Avoid arches; favor knees-to-chest &amp; flexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Pranayama Breathing Pacer */}
        <div className="bg-emerald-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Pranayama Autonomic Pacer (Vagal Tone Activation)
            </span>
            <p className="text-xs text-emerald-100 max-w-md">
              Synchronize your breath with the visual pacer. Prolonged exhalation activates parasympathetic nerves, reducing dorsal horn pain signal transmission.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
                breathPhase === 'Inhale'
                  ? 'border-emerald-300 bg-emerald-700/80 scale-110'
                  : breathPhase === 'Hold'
                  ? 'border-amber-300 bg-amber-700/80 scale-105'
                  : 'border-teal-300 bg-teal-800/80 scale-95'
              }`}
            >
              <span className="text-xs font-bold">{breathPhase}</span>
              <span className="text-[10px] opacity-80">{breathSeconds}s</span>
            </div>
          </div>
        </div>

        {/* Interactive Pose Player */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
          {!isCompleted && currentPose ? (
            <>
              {/* Header with pose count */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Pose {currentPoseIdx + 1} of {filteredPoses.length}
                </span>
                <div className="flex gap-1.5">
                  {filteredPoses.map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-6 h-1.5 rounded-full ${
                        idx === currentPoseIdx
                          ? 'bg-emerald-600'
                          : idx < currentPoseIdx
                          ? 'bg-teal-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Pose Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{currentPose.english}</h2>
                    <span className="text-xs italic font-serif text-emerald-800">{currentPose.sanskrit}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 flex items-center justify-center shadow-xs">
                      <span className="font-mono text-xl font-bold text-slate-900">{timerSeconds}s</span>
                    </div>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`text-xs px-4 py-2.5 rounded-lg font-bold text-white shadow-sm transition cursor-pointer ${
                        isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isPlaying ? '⏸ Pause' : '▶ Start Pose Timer'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">How to Practice:</span>
                  <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                    {currentPose.cues.map((cue, cidx) => (
                      <li key={cidx}>{cue}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                  💨 <strong>Breath Synchronization:</strong> {currentPose.breathingCue}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                  🛡️ <strong>Spine Safety Alert:</strong> {currentPose.spineSafety}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentPoseIdx((i) => Math.max(0, i - 1))}
                  disabled={currentPoseIdx === 0}
                  className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 font-semibold cursor-pointer"
                >
                  ← Previous Pose
                </button>

                <button
                  onClick={() => {
                    if (currentPoseIdx < filteredPoses.length - 1) {
                      setCurrentPoseIdx((i) => i + 1);
                    } else {
                      setIsCompleted(true);
                    }
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition"
                >
                  {currentPoseIdx < filteredPoses.length - 1 ? 'Next Pose →' : 'Complete Sequence ✓'}
                </button>
              </div>
            </>
          ) : (
            /* Completed Sequence */
            <div className="text-center py-8 bg-emerald-50 rounded-xl border border-emerald-200 p-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                🌸
              </div>
              <h2 className="text-xl font-bold text-emerald-900">Spine Yoga Practice Complete!</h2>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                You completed the spine-sparing asana sequence tailored to your {directionalPreference.replace(/_/g, ' ')} profile. Rest gently in Savasana for 2–3 minutes.
              </p>

              <button
                onClick={() => {
                  setCurrentPoseIdx(0);
                  setIsCompleted(false);
                  setIsPlaying(false);
                }}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Restart Sequence
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
