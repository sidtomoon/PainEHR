'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ACTPage() {
  const [activeTab, setActiveTab] = useState<'bullseye' | 'defusion'>('bullseye');

  // Values Bullseye state (1-10)
  const [bullseyeValues, setBullseyeValues] = useState({
    relationships: 6,
    work: 5,
    health: 4,
    growth: 5,
  });
  const [committedAction, setCommittedAction] = useState('');
  const [savedAction, setSavedAction] = useState(false);

  // Defusion state
  const [selectedThought, setSelectedThought] = useState('My spine is completely ruined and fragile');
  const [customThought, setCustomThought] = useState('');
  const [defusionStage, setDefusionStage] = useState(1);
  const [isFloatingAway, setIsFloatingAway] = useState(false);
  const [copiedRx, setCopiedRx] = useState(false);

  const commonThoughts = [
    'My spine is completely ruined and fragile',
    'I can’t enjoy anything until this pain goes away completely',
    'If I move, I will end up in a wheelchair',
    'I am a burden to my family because of this pain',
    'My life has been stolen by this back condition',
  ];

  const avgAlignment = Math.round(
    (bullseyeValues.relationships + bullseyeValues.work + bullseyeValues.health + bullseyeValues.growth) / 4
  );

  async function copyRxProtocol() {
    const rxText = `Rx: Acceptance & Commitment Therapy (ACT) for Chronic Pain
- Core Objective: Psychological Flexibility & Values-Based Living.
- Exercise 1: Values Bull's-Eye (Focus on Relationships, Work, Health, Joy despite pain).
- Exercise 2: Cognitive Defusion (Unhook from catastrophic thoughts: "I am noticing the thought that...").
- Practice: Commit to 1 small values-based action daily, shifting focus from pain-control to life-vitality.
- Evidence: McCracken & Vowles Clinical Trials.`;
    await navigator.clipboard.writeText(rxText);
    setCopiedRx(true);
    setTimeout(() => setCopiedRx(false), 2500);
  }

  function handleFloatAway() {
    setIsFloatingAway(true);
    setTimeout(() => {
      setDefusionStage(4);
      setIsFloatingAway(false);
    }, 2500);
  }

  const activeThoughtText = customThought.trim() || selectedThought;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/modalities" className="text-xs text-amber-800 hover:text-amber-900 font-medium">
            ← Back to Modalities Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
              Psychological Flexibility Protocol
            </span>
            <button
              onClick={copyRxProtocol}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              {copiedRx ? '✓ Copied Rx' : '📋 Copy ACT Prescription'}
            </button>
          </div>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wide">
            <span>Acceptance &amp; Commitment Therapy (ACT)</span>
            <span>·</span>
            <span>Living Beyond Pain</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            ACT for Chronic Pain
          </h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Chronic pain often narrows life into an exhausting, futile struggle to eliminate all discomfort before living can resume. ACT shifts the focus from <em>eradicating pain</em> to <strong>psychological flexibility</strong> and living a rich, values-guided life.
          </p>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('bullseye')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'bullseye'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎯 Values Bull’s-Eye Assessment
            </button>
            <button
              onClick={() => setActiveTab('defusion')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'defusion'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🍂 Thought Defusion Simulator (&ldquo;Unhooking&rdquo;)
            </button>
          </div>
        </div>

        {/* TAB 1: Values Bull's-Eye */}
        {activeTab === 'bullseye' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">The Values Bull’s-Eye</h2>
                <p className="text-xs text-slate-500">
                  Rate how close you are living to your core values in 4 key domains (10 = right on the bullseye; 1 = far off target).
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded">
                  Overall Alignment: {avgAlignment} / 10
                </span>
              </div>
            </div>

            {/* 4 Domains Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Domain 1: Relationships */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">1. Relationships &amp; Connection</span>
                  <span className="text-amber-800 font-mono text-sm">{bullseyeValues.relationships} / 10</span>
                </div>
                <p className="text-[11px] text-slate-500">Family, friends, intimacy, genuine emotional connection.</p>
                <input
                  type="range" min="1" max="10" value={bullseyeValues.relationships}
                  onChange={(e) => setBullseyeValues({ ...bullseyeValues, relationships: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                />
              </div>

              {/* Domain 2: Work & Learning */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">2. Work, Vocation &amp; Contribution</span>
                  <span className="text-amber-800 font-mono text-sm">{bullseyeValues.work} / 10</span>
                </div>
                <p className="text-[11px] text-slate-500">Career, volunteering, household contribution, meaningful productivity.</p>
                <input
                  type="range" min="1" max="10" value={bullseyeValues.work}
                  onChange={(e) => setBullseyeValues({ ...bullseyeValues, work: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                />
              </div>

              {/* Domain 3: Health & Body Care */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">3. Health, Self-Care &amp; Body</span>
                  <span className="text-amber-800 font-mono text-sm">{bullseyeValues.health} / 10</span>
                </div>
                <p className="text-[11px] text-slate-500">Nourishment, gentle movement, sleep, respecting your body.</p>
                <input
                  type="range" min="1" max="10" value={bullseyeValues.health}
                  onChange={(e) => setBullseyeValues({ ...bullseyeValues, health: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                />
              </div>

              {/* Domain 4: Personal Growth & Play */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">4. Personal Growth, Play &amp; Joy</span>
                  <span className="text-amber-800 font-mono text-sm">{bullseyeValues.growth} / 10</span>
                </div>
                <p className="text-[11px] text-slate-500">Creativity, hobbies, nature, humor, relaxation.</p>
                <input
                  type="range" min="1" max="10" value={bullseyeValues.growth}
                  onChange={(e) => setBullseyeValues({ ...bullseyeValues, growth: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                />
              </div>
            </div>

            {/* Committed Action Step */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🧭</span>
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Committed Action for This Week
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                What is <strong>one tangible, small action</strong> you will take this week in your lowest-scoring domain, even if pain or stiffness is present?
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={committedAction}
                  onChange={(e) => setCommittedAction(e.target.value)}
                  placeholder="e.g. Call my sister for 15 mins, or sit in the garden for 10 mins without checking pain"
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => setSavedAction(true)}
                  className="text-xs bg-amber-800 hover:bg-amber-900 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer transition"
                >
                  {savedAction ? '✓ Committed' : 'Save Action'}
                </button>
              </div>
              {savedAction && (
                <div className="text-xs text-emerald-800 font-medium pt-1">
                  ✓ Action committed: &ldquo;{committedAction}&rdquo;. This will be reviewed at your next check-in.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Cognitive Defusion Tool */}
        {activeTab === 'defusion' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cognitive Defusion (&ldquo;Unhooking from Pain Thoughts&rdquo;)</h2>
              <p className="text-xs text-slate-500">
                In chronic pain, catastrophic thoughts hook our attention and create somatic tension. Defusion helps you see thoughts as mental events, not absolute truths.
              </p>
            </div>

            {/* Step 1: Select sticky thought */}
            {defusionStage === 1 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
                  <strong>Step 1:</strong> Select or type a persistent pain thought that currently hooks you:
                </div>

                <div className="space-y-1.5">
                  {commonThoughts.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedThought(t);
                        setCustomThought('');
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        selectedThought === t && !customThought
                          ? 'bg-amber-100/70 border-amber-300 text-amber-900 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      &ldquo;{t}&rdquo;
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={customThought}
                  onChange={(e) => setCustomThought(e.target.value)}
                  placeholder="Or type your own sticky pain thought here..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <button
                  onClick={() => setDefusionStage(2)}
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
                >
                  Next: Step Back &amp; Name the Thought →
                </button>
              </div>
            )}

            {/* Step 2: Notice the thought */}
            {defusionStage === 2 && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Stage 2: Cognitive Distance</span>
                  <p className="text-base font-medium text-slate-800">
                    Instead of fusing with: <br />
                    <span className="line-through text-slate-400 font-normal">&ldquo;{activeThoughtText}&rdquo;</span>
                  </p>
                  <p className="text-base font-bold text-amber-900 bg-white p-3 rounded-lg border border-amber-200 max-w-lg mx-auto">
                    &ldquo;I notice that I am having the thought that: {activeThoughtText}&rdquo;
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Notice how adding those few words creates a cushion of space between <em>You</em> (the observer) and the thought.
                  </p>
                </div>

                <button
                  onClick={() => setDefusionStage(3)}
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
                >
                  Next: Leaves on a Stream Simulator →
                </button>
              </div>
            )}

            {/* Step 3: Leaves on a Stream Simulator */}
            {defusionStage === 3 && (
              <div className="space-y-4 text-center">
                <div className="bg-slate-900 text-white rounded-xl p-8 space-y-4 overflow-hidden relative">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Leaves on a Stream</span>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Imagine sitting beside a gently flowing stream. Place your thought onto an autumn leaf floating on the water. Watch it drift past without forcing it away.
                  </p>

                  {/* Visual Leaf Floating Box */}
                  <div className="py-6 h-24 flex items-center justify-center">
                    <div
                      className={`transition-all duration-2000 ease-in-out p-3 rounded-xl bg-amber-800/90 text-amber-100 text-xs font-semibold shadow-md flex items-center gap-2 ${
                        isFloatingAway
                          ? 'translate-x-96 opacity-0 scale-75'
                          : 'translate-x-0 opacity-100 scale-100'
                      }`}
                    >
                      <span>🍂</span>
                      <span>&ldquo;{activeThoughtText}&rdquo;</span>
                    </div>
                  </div>

                  <button
                    onClick={handleFloatAway}
                    disabled={isFloatingAway}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    {isFloatingAway ? 'Drifting down the stream…' : 'Release Thought onto the Stream ➔'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Complete & Ground */}
            {defusionStage === 4 && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl">
                  🧘
                </div>
                <h3 className="font-bold text-emerald-900 text-sm">You Are the Observer, Not the Thought</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thoughts come and go like weather. You do not need to fight or debate them. Now, gently return your attention to your committed values action for today.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => setDefusionStage(1)}
                    className="text-xs bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-800 cursor-pointer"
                  >
                    Unhook Another Thought
                  </button>
                  <button
                    onClick={() => setActiveTab('bullseye')}
                    className="text-xs bg-white text-emerald-800 border border-emerald-300 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-50 cursor-pointer"
                  >
                    Back to Values Bull’s-Eye
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
