import Link from 'next/link';
import { Header } from '@/app/components/Header';

export default function ModalitiesHubPage() {
  const modalities = [
    {
      id: 'prt',
      title: 'Pain Reprocessing Therapy (PRT)',
      commercialModel: 'Lin Health Model',
      tag: 'Neuroplastic Retraining',
      evidence: 'JAMA Psychiatry (Ashar et al. Boulder Study: 66% pain-free/near pain-free at 1 year)',
      indication: 'Centralized / nociplastic pain, chronic low back/neck pain, fibromyalgia, failed back surgery syndrome without acute instability.',
      description:
        'Retrains the brain to interpret safe bodily sensations as non-threatening. Uses Somatic Tracking to de-escalate fear-pain conditioning.',
      features: [
        'FIT Neuroplastic Pain Screener',
        'Interactive Somatic Tracking with sensation explorer',
        'Pre/Post Session Threat Level Meter',
        'Cognitive Safety Reappraisal Cues',
      ],
      href: '/modalities/prt',
      color: 'teal',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
      btnBg: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
    {
      id: 'graded-pt',
      title: 'Psychologically-Informed PT & Graded Exercise',
      commercialModel: 'Hinge Health & Kaia Health Model',
      tag: 'Active Biomechanical Rehab',
      evidence: 'NICE NG193 Guidelines & Cochrane Reviews (Grade A evidence for chronic primary pain)',
      indication: 'Kinesiophobia (fear of movement), spine osteoarthritis, mechanical back/neck pain, post-procedure rehabilitation.',
      description:
        'Breaks the "boom-and-bust" avoidance cycle using pacing, graded exposure, and cognitive reassurance that "hurt does not equal harm".',
      features: [
        'Traffic Light Movement Pacing (Green/Yellow/Red)',
        'Fear-Avoidance / Kinesiophobia Assessment',
        'Interactive Guided Routine with Timer & Reps',
        'Real-time Psychological Movement Cues',
      ],
      href: '/modalities/graded-pt',
      color: 'blue',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      id: 'act',
      title: 'Acceptance & Commitment Therapy (ACT)',
      commercialModel: 'Psychological Flexibility Protocol',
      tag: 'Values-Based Living',
      evidence: 'McCracken & Vowles Clinical Trials (Significant reduction in pain interference & disability)',
      indication: 'High pain catastrophizing, chronic intractable pain, mood disturbance, loss of valued life activities.',
      description:
        'Shifts the goal from "eradicating pain at all costs" to living a rich, meaningful life despite physical discomfort via defusion and values-based actions.',
      features: [
        'Interactive Values Bull’s-Eye (4 Life Domains)',
        'Cognitive Defusion: "Unhooking from Pain Thoughts"',
        'Willingness vs Struggle Pain Paradox Visualizer',
        'Committed Action Goal Setter',
      ],
      href: '/modalities/act',
      color: 'amber',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    {
      id: 'yoga',
      title: 'Evidence-Based Yoga for Chronic Low Back Pain',
      commercialModel: 'Iyengar / NIH CLBP Protocol',
      tag: 'Mind-Body Spine Pacing',
      evidence: 'Annals of Internal Medicine (Saper et al. Non-inferior to physical therapy for back pain and function)',
      indication: 'Chronic mechanical low back pain, axial stiffness, myofascial pelvic/spine tightness, autonomic arousal.',
      description:
        'Spine-sparing yoga asanas paired with pranayama breathing to downregulate sympathetic hyperarousal and restore gentle spinal mobility.',
      features: [
        'Directional Preference Screener (Flexion vs Extension vs Neutral)',
        'Spine-Sparing Asana Sequence Player',
        'Live Pranayama Breathing Pacer (4s Inhale / 6s Exhale)',
        'Precautions & Red-Flag Movement Alerts',
      ],
      href: '/modalities/yoga',
      color: 'emerald',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      id: 'cbt-i',
      title: 'CBT-I for Sleep-Pain Comorbidity',
      commercialModel: 'Somryst / Sleepio Digital Model',
      tag: 'Sleep Consolidation',
      evidence: 'NIH Consensus & Finan/Smith Meta-analyses (Consolidating sleep reduces central pain sensitization)',
      indication: 'Chronic insomnia co-occurring with pain, frequent night awakenings due to discomfort, sleep efficiency <85%.',
      description:
        'Breaks the bidirectional insomnia-pain spiral by resetting circadian sleep drive, eliminating catastrophic bedtime anxiety, and enforcing stimulus control.',
      features: [
        'Interactive Sleep Efficiency Calculator (SE%)',
        'Personalized Sleep Restriction Window Prescription',
        'Stimulus Control 20-Minute Rule Guide',
        'Bedtime Pain Wind-Down & Relaxation Guide',
      ],
      href: '/modalities/cbt-i',
      color: 'indigo',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  ];

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hub Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            <span>Non-Invasive Care Suite</span>
            <span>·</span>
            <span>Digital Therapy Prescription Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            5 Interactive Non-Invasive Pain Modalities
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Evidence-based digital and cognitive-behavioral tools modeled after leading digital therapeutics
            (<strong>Lin Health, Hinge Health, Kaia Health, Somryst/Sleepio</strong>). Clinicians can conduct interactive in-clinic sessions, assign digital prescriptions, or educate patients.
          </p>
        </div>

        {/* Quick Prescribe Banner */}
        <div className="mb-8 bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-teal-400 font-bold text-sm">💡 Quick In-Clinic Workflow:</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                1-Click Rx
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              You can prescribe any of these 5 modalities directly during an encounter in{' '}
              <strong className="text-white">CaptureFlow</strong>. They will automatically format into the Treatment Plan and appear on the patient’s soft copy Prescription PDF!
            </p>
          </div>
          <Link
            href="/patients"
            className="inline-flex items-center justify-center text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-lg transition whitespace-nowrap shadow-sm"
          >
            ← Open Patient Records
          </Link>
        </div>

        {/* Modality Cards Grid */}
        <div className="space-y-6">
          {modalities.map((mod, index) => (
            <div
              key={mod.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-6 shadow-xs transition hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-slate-400">0{index + 1}</span>
                    <h2 className="text-lg font-bold text-slate-900">{mod.title}</h2>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${mod.badgeBg}`}>
                      {mod.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{mod.commercialModel}</span>
                    <span>·</span>
                    <span>{mod.evidence}</span>
                  </div>
                </div>

                <Link
                  href={mod.href}
                  className={`inline-flex items-center justify-center text-xs font-bold px-4 py-2.5 rounded-lg transition shadow-xs whitespace-nowrap cursor-pointer ${mod.btnBg}`}
                >
                  Launch Interactive Module →
                </Link>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-4">{mod.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                    Best Clinical Indications:
                  </span>
                  <p className="text-slate-600">{mod.indication}</p>
                </div>

                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                    Interactive Features Built-In:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.features.map((feat, fidx) => (
                      <span
                        key={fidx}
                        className="inline-block bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px]"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
