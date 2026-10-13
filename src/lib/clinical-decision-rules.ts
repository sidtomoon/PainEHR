import type { PainLocation } from '@/lib/types';

export interface HistoryQuestion {
  id: string;
  label: string;
  type: 'single' | 'multi';
  options: string[];
  isRedFlag?: boolean;
}

export interface ClinicalRule {
  id: string;
  name: string;
  directedLocations: PainLocation[];
  locationLabels: Partial<Record<PainLocation, string>>;
  defaultLocation: PainLocation;
  questions: HistoryQuestion[];
}

export const CLINICAL_RULES: Record<string, ClinicalRule> = {
  lumbar: {
    id: 'lumbar',
    name: 'Low Back / Lumbar Spine',
    directedLocations: ['lumbar', 'other', 'hip', 'neuropathic'],
    locationLabels: {
      lumbar: 'Lumbar (Low back / lumbosacral)',
      other: 'Other (Radicular Leg / Buttock / Sciatica)',
      hip: 'Hip / Sacroiliac region',
      neuropathic: 'Neuropathic (Radicular nerve distribution)',
    },
    defaultLocation: 'lumbar',
    questions: [
      {
        id: 'radiation',
        label: 'Radicular Leg Pain (Sciatica)',
        type: 'single',
        options: ['None (Axial back only)', 'Right Leg (Sciatica)', 'Left Leg (Sciatica)', 'Bilateral Legs'],
      },
      {
        id: 'dermatome',
        label: 'Suspected Lumbar Dermatome',
        type: 'single',
        options: [
          'Not applicable / Axial',
          'L3/L4 (Anterior thigh & knee)',
          'L5 (Lateral calf to dorsum of foot/big toe)',
          'S1 (Posterior calf to heel & sole)',
          'Non-dermatomal / Myofascial',
        ],
      },
      {
        id: 'claudication',
        label: 'Walking & Standing Impact (Stenosis)',
        type: 'single',
        options: [
          'No claudication',
          'Neurogenic claudication (worse walking/standing, relieved by forward flexion/sitting)',
          'Vascular claudication (cramping, fixed walking distance, relieved standing still)',
        ],
      },
      {
        id: 'mechanical',
        label: 'Postural / Mechanical Provocation',
        type: 'single',
        options: [
          'Flexion / Sitting worse (discogenic pattern)',
          'Extension / Standing worse (facetogenic pattern)',
          'Sit-to-stand / Stairs worse (SI joint pattern)',
          'Non-mechanical / Constant at rest',
        ],
      },
      {
        id: 'red_flags_cauda',
        label: 'Cauda Equina & Critical Spine Red Flags',
        type: 'multi',
        isRedFlag: true,
        options: [
          'Bladder retention or overflow incontinence',
          'Loss of bowel sphincter control',
          'Saddle anesthesia (perineum / inner thighs numbness)',
          'Progressive motor weakness (e.g. Foot drop)',
          'Unexplained weight loss or fever',
          'History of cancer / immunosuppression',
        ],
      },
    ],
  },

  cervical: {
    id: 'cervical',
    name: 'Neck / Cervical Spine',
    directedLocations: ['cervical', 'shoulder', 'thoracic', 'neuropathic', 'other'],
    locationLabels: {
      cervical: 'Cervical (Neck / suboccipital)',
      shoulder: 'Shoulder / Trapezius / Scapular',
      thoracic: 'Thoracic / Upper back',
      neuropathic: 'Neuropathic (Arm / Hand radiculopathy)',
      other: 'Other (Occipital / Cervicogenic head)',
    },
    defaultLocation: 'cervical',
    questions: [
      {
        id: 'radiation',
        label: 'Arm Pain (Cervical Radiculopathy / Brachialgia)',
        type: 'single',
        options: ['None (Axial neck only)', 'Right Arm', 'Left Arm', 'Bilateral Arms'],
      },
      {
        id: 'dermatome',
        label: 'Suspected Cervical Level',
        type: 'single',
        options: [
          'Not applicable / Axial',
          'C5 (Deltoid & lateral shoulder)',
          'C6 (Biceps, thumb & index finger)',
          'C7 (Triceps & middle finger)',
          'C8/T1 (Ring/little finger & medial forearm)',
        ],
      },
      {
        id: 'myelopathy_red_flags',
        label: 'Cervical Myelopathy Screening',
        type: 'multi',
        isRedFlag: true,
        options: [
          'Clumsy hands (trouble buttoning shirts, dropping cups)',
          'Gait unsteadiness / balance loss while walking',
          'Electric shock down spine on neck flexion (Lhermitte’s sign)',
          'Bowel or bladder urgency / hesitation',
        ],
      },
    ],
  },

  knee: {
    id: 'knee',
    name: 'Knee & Lower Extremity',
    directedLocations: ['knee', 'hip', 'other'],
    locationLabels: {
      knee: 'Knee (Patellofemoral / Joint line)',
      hip: 'Hip / Referred groin',
      other: 'Other (Lower extremity / Ankle)',
    },
    defaultLocation: 'knee',
    questions: [
      {
        id: 'laterality',
        label: 'Affected Knee',
        type: 'single',
        options: ['Right Knee', 'Left Knee', 'Bilateral Knees'],
      },
      {
        id: 'stiffness',
        label: 'Morning Stiffness Duration',
        type: 'single',
        options: ['< 30 minutes (consistent with Osteoarthritis)', '> 30 minutes (Inflammatory / RA suspicion)', 'No morning stiffness'],
      },
      {
        id: 'mechanical',
        label: 'Mechanical & Joint Symptoms',
        type: 'multi',
        options: [
          'Weight-bearing aggravation (stairs / squatting)',
          'True joint locking (meniscal mechanical block)',
          'Instability / giving way',
          'Joint effusion / visible swelling',
          'Night pain disturbing sleep',
        ],
      },
    ],
  },

  shoulder: {
    id: 'shoulder',
    name: 'Shoulder & Upper Extremity',
    directedLocations: ['shoulder', 'cervical', 'thoracic', 'other'],
    locationLabels: {
      shoulder: 'Shoulder (Subacromial / Glenohumeral)',
      cervical: 'Cervical (Referred neck to shoulder)',
      thoracic: 'Thoracic / Periscapular',
      other: 'Other (Upper extremity)',
    },
    defaultLocation: 'shoulder',
    questions: [
      {
        id: 'laterality',
        label: 'Affected Shoulder',
        type: 'single',
        options: ['Right Shoulder', 'Left Shoulder', 'Bilateral Shoulders'],
      },
      {
        id: 'pain_pattern',
        label: 'Functional Limitation / Pattern',
        type: 'single',
        options: [
          'Painful arc with overhead reach (Impingement / Rotator cuff)',
          'Severe loss of active & passive range of motion (Frozen shoulder)',
          'Localized to AC joint / cross-body adduction pain',
          'Weakness with shoulder abduction or external rotation',
        ],
      },
      {
        id: 'sleep_impact',
        label: 'Sleep Impact',
        type: 'single',
        options: ['Unable to sleep on affected side', 'Night pain independent of position', 'No sleep disruption'],
      },
    ],
  },

  head_face: {
    id: 'head_face',
    name: 'Head, Face & Trigeminal',
    directedLocations: ['other', 'cervical', 'neuropathic'],
    locationLabels: {
      other: 'Other (Face / Trigeminal / Scalp / TMJ)',
      cervical: 'Cervical (Occipital / Cervicogenic)',
      neuropathic: 'Neuropathic (Cranial nerve distribution)',
    },
    defaultLocation: 'other',
    questions: [
      {
        id: 'character',
        label: 'Pain Character',
        type: 'single',
        options: [
          'Electric shock / Shooting / Paroxysmal seconds (Trigeminal Neuralgia)',
          'Throbbing / Pulsating unilateral with nausea/photophobia (Migraine)',
          'Severe periorbital with autonomic tearing/congestion (Cluster)',
          'Constant dull ache / Tight band (Tension-type / Myofascial)',
        ],
      },
      {
        id: 'triggers',
        label: 'Trigger Factors (Trigeminal / TMJ)',
        type: 'multi',
        options: [
          'Light touch / Washing face / Shaving',
          'Chewing / Talking / Brushing teeth',
          'Cold wind or air conditioning breeze',
          'Jaw clenching / Teeth grinding / Neck movement',
        ],
      },
      {
        id: 'headache_red_flags',
        label: 'Headache & Facial Red Flags',
        type: 'multi',
        isRedFlag: true,
        options: [
          'Sudden "thunderclap" peak within seconds',
          'New onset headache in patient > 50 years (Temporal arteritis)',
          'Jaw claudication or scalp tenderness',
          'Fever, neck stiffness, altered sensorium',
          'Focal neurological deficit or visual changes',
        ],
      },
    ],
  },

  neuropathic: {
    id: 'neuropathic',
    name: 'Neuropathic Pain Syndrome',
    directedLocations: ['neuropathic', 'other', 'widespread'],
    locationLabels: {
      neuropathic: 'Neuropathic (Primary peripheral / central)',
      other: 'Other (Dermatomal / Stocking-glove)',
      widespread: 'Widespread neuropathic distribution',
    },
    defaultLocation: 'neuropathic',
    questions: [
      {
        id: 'descriptors',
        label: 'Sensory Descriptors (DN4 Components)',
        type: 'multi',
        options: [
          'Burning sensation',
          'Painfully cold sensation',
          'Electric shock-like sensations',
          'Tingling / Pins and needles',
          'Numbness / Hypoesthesia to touch',
        ],
      },
      {
        id: 'evoked_pain',
        label: 'Evoked Pain Symptoms',
        type: 'single',
        options: [
          'Dynamic mechanical allodynia (pain provoked by light brushing/clothes)',
          'Hyperalgesia (pain provoked by light pressure)',
          'None / Spontaneous pain only',
        ],
      },
      {
        id: 'crps_signs',
        label: 'Autonomic / Trophic Changes (CRPS Screening)',
        type: 'multi',
        options: [
          'Skin temperature asymmetry (>1°C difference)',
          'Skin color asymmetry / mottling',
          'Asymmetric edema / swelling',
          'Abnormal hair or nail growth in affected limb',
        ],
      },
    ],
  },

  widespread: {
    id: 'widespread',
    name: 'Chronic Widespread / Fibromyalgia',
    directedLocations: ['widespread', 'neuropathic', 'other'],
    locationLabels: {
      widespread: 'Widespread (Diffuse / Multi-segmental)',
      neuropathic: 'Neuropathic component',
      other: 'Other (Specific tender point clusters)',
    },
    defaultLocation: 'widespread',
    questions: [
      {
        id: 'distribution',
        label: 'Body Distribution',
        type: 'single',
        options: [
          'Generalized (axial + left + right + above & below waist)',
          'Multi-site regional without generalized spread',
        ],
      },
      {
        id: 'polysymptomatic',
        label: 'Symptom Severity Inventory',
        type: 'multi',
        options: [
          'Unrefreshing sleep / Severe morning exhaustion',
          'Debilitating chronic fatigue',
          'Cognitive difficulties / Memory fog ("fibro fog")',
          'Somatic symptoms: IBS, headaches, interstitial cystitis',
          'Environmental hypersensitivity (sound, bright light, odors)',
        ],
      },
    ],
  },
};

/**
 * Matches a diagnosis text or ICD-11 code to the appropriate clinical decision rule.
 */
export function matchClinicalRule(diagnosisCode: string = '', diagnosisText: string = ''): ClinicalRule | null {
  const code = diagnosisCode.trim().toUpperCase();
  const text = diagnosisText.trim().toLowerCase();

  if (!code && !text) return null;

  // 1. Lumbar Spine / Low back / Sciatica
  const lumbarCodes = ['ME84', 'ME84.0', 'ME84.2', 'FA02', 'FA80', '8B41', 'FB54.1', 'FA70'];
  const lumbarKeywords = [
    'back', 'lumbar', 'sciatica', 'lumbosacral', 'stenosis', 'pivd', 'disc herniation',
    'sacroiliac', 'sij', 'facet lumbar', 'lumbago', 'cauda', 'spondylolisthesis',
  ];
  if (lumbarCodes.some((c) => code.startsWith(c)) || lumbarKeywords.some((k) => text.includes(k))) {
    return CLINICAL_RULES.lumbar;
  }

  // 2. Cervical Spine / Neck / Cervical radiculopathy
  const cervicalCodes = ['ME82', 'FA03', '8B40'];
  const cervicalKeywords = ['neck', 'cervical', 'cervicalgia', 'brachialgia', 'cervicogenic', 'whiplash'];
  if (cervicalCodes.some((c) => code.startsWith(c)) || cervicalKeywords.some((k) => text.includes(k))) {
    return CLINICAL_RULES.cervical;
  }

  // 3. Knee
  const kneeCodes = ['FA00'];
  const kneeKeywords = ['knee', 'patella', 'genicular', 'gonarthrosis', 'meniscus'];
  if (kneeCodes.some((c) => code.startsWith(c)) || kneeKeywords.some((k) => text.includes(k))) {
    return CLINICAL_RULES.knee;
  }

  // 4. Shoulder
  const shoulderKeywords = ['shoulder', 'rotator cuff', 'frozen shoulder', 'capsulitis', 'impingement', 'acromioclavicular'];
  if (shoulderKeywords.some((k) => text.includes(k))) {
    return CLINICAL_RULES.shoulder;
  }

  // 5. Head / Orofacial / Trigeminal
  const headCodes = ['8B82', 'MG30.03', 'MG30.5'];
  const headKeywords = ['trigeminal', 'facial', 'headache', 'migraine', 'cluster', 'tmd', 'tmj', 'occipital'];
  if (headCodes.some((c) => code.startsWith(c)) || headKeywords.some((k) => text.includes(k))) {
    return CLINICAL_RULES.head_face;
  }

  // 6. Neuropathic / CRPS / Postherpetic / Diabetic
  const neuroCodes = ['5A14', '8C00.0', '8D8A.0', '8D8A.1', '8C0Y', 'MG30.4', 'MG30.40', 'MG30.41'];
  const neuroKeywords = ['neuropathy', 'phn', 'crps', 'burning', 'postherpetic', 'shingles', 'diabetic neuropathy', 'neuralgia'];
  if (neuroCodes.some((c) => code.startsWith(c)) || neuroKeywords.some((k) => text.includes(k))) {
    return CLINICAL_RULES.neuropathic;
  }

  // 7. Widespread / Fibromyalgia
  const widespreadCodes = ['MG30.00', 'MG30.0', 'FB56.4'];
  const widespreadKeywords = ['widespread', 'fibromyalgia', 'cwp', 'myofascial'];
  if (widespreadCodes.some((c) => code.startsWith(c)) || widespreadKeywords.some((k) => text.includes(k))) {
    return CLINICAL_RULES.widespread;
  }

  return null;
}

/**
 * Detects whether a diagnosis code or diagnosis text indicates cancer / malignancy.
 */
export function isCancerDiagnosis(diagnosisCode: string = '', diagnosisText: string = ''): boolean {
  const code = diagnosisCode.trim().toUpperCase();
  const text = diagnosisText.trim().toLowerCase();
  if (!code && !text) return false;

  // ICD-11 Chronic cancer pain: MG30.1, MG30.10, MG30.11
  // Neoplasms chapters (2A.. to 2F.., C00-D49)
  const cancerCodes = [
    'MG30.1', '2A', '2B', '2C', '2D', '2E', '2F',
    'C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'D0', 'D3', 'D4',
  ];
  if (cancerCodes.some((c) => code.startsWith(c))) return true;

  const cancerKeywords = [
    'cancer', 'carcinoma', 'malignan', 'tumor', 'tumour', 'oncolog', 'metast',
    'lymphoma', 'leukemia', 'melanoma', 'sarcoma', 'myeloma', 'chemotherapy',
    'radiotherapy', 'palliative', 'neoplasm', 'ca breast', 'ca lung', 'ca colon',
    'ca prostate', 'ca cervix', 'ca pancreas', 'ca stomach', 'ca oral', 'ca tongue',
  ];
  return cancerKeywords.some((kw) => text.includes(kw));
}

/**
 * Checks whether a diagnosis warrants screening for Chronic Widespread Pain (CWP / Fibromyalgia / Myofascial / Osteoporosis / Polyarthritis).
 * Focal conditions like low back pain, isolated knee OA, or cervical radiculopathy return false.
 */
export function shouldCheckWidespreadPain(diagnosisCode: string = '', diagnosisText: string = ''): boolean {
  const code = diagnosisCode.trim().toUpperCase();
  const text = diagnosisText.trim().toLowerCase();
  if (!code && !text) return false;

  // CWP / Fibromyalgia / Rheumatoid & Polyarthritis / Osteoporosis codes
  const widespreadCodes = [
    'MG30.0', 'MG30.00', 'FB56.4', 'FA20', 'FA21', 'FA22', 'FA23', 'FA24', 'FA25', 'FB80', 'FB81', 'FB82', 'FB83',
  ];
  if (widespreadCodes.some((c) => code.startsWith(c))) return true;

  const widespreadKeywords = [
    'widespread',
    'fibromyalgia',
    'myofascial',
    'osteoporosis',
    'osteopeni',
    'polyarthr',
    'rheumatoid',
    'ankylosing',
    'spondyloarthr',
    'central sensit',
    'cwp',
    'hypermobil',
    'ehlers-danlos',
    'polymyalgia',
  ];

  return widespreadKeywords.some((kw) => text.includes(kw));
}

export const PAIN_SCORE_OPTIONS = [
  { value: '0', label: '0 - No pain' },
  { value: '1', label: '1 - Mild (barely noticeable)' },
  { value: '2', label: '2 - Mild (noticeable, easily tolerated)' },
  { value: '3', label: '3 - Mild (tolerable, but noticeable)' },
  { value: '4', label: '4 - Moderate (interferes with chores / tasks)' },
  { value: '5', label: '5 - Moderate (moderate pain, hard to ignore)' },
  { value: '6', label: '6 - Moderate (interferes with concentration / work)' },
  { value: '7', label: '7 - Severe (disabling, hard to perform tasks)' },
  { value: '8', label: '8 - Severe (major limitation, unable to work)' },
  { value: '9', label: '9 - Severe (excruciating, unable to function)' },
  { value: '10', label: '10 - Worst pain imaginable / Bedridden' },
];

export const FUNCTIONAL_IMPACT_OPTIONS = [
  { value: 'Normal (No functional limitation)', label: 'Normal — No limitation in daily activities or work', score: '0' },
  { value: 'Mild (Strenuous activities/sports limited)', label: 'Mild — Normal daily routine, strenuous activities/sports limited', score: '2' },
  { value: 'Moderate (ADLs & work limited)', label: 'Moderate — Difficulty with occupational duties, housework & chores', score: '5' },
  { value: 'Severe (Self-care difficult, major disability)', label: 'Severe — Difficulty with basic self-care ADLs, largely homebound', score: '8' },
  { value: 'Bedridden / Completely dependent', label: 'Bedridden / Wheelchair-bound — Completely dependent for care', score: '10' },
];

/**
 * Structured Management Protocol Types
 */
export interface ConservativeThermalCare {
  hotPack: string;
  coldPack: string;
  coldPackPostProcedure?: string;
  alternateContrast: string;
}

export interface ManagementProtocol {
  id: string;
  name: string;
  conditionDescription: string;
  thermalAdvice: ConservativeThermalCare;
  physiotherapy: {
    protocolName: string;
    exercises: string[];
    precautions: string[];
  };
  yoga: {
    asanas: string[];
    pranayama: string[];
    precautions: string[];
  };
  nonInvasiveAdvice: string[];
}

export const CONSERVATIVE_THERMAL_OPTIONS = [
  {
    id: 'hot_pack',
    label: 'Hot Pack (Moist Heat)',
    shortLabel: 'Hot Pack (15–20 min)',
    text: 'Hot pack / moist heat application for 15–20 minutes, 2–3 times daily for muscle spasm, chronic joint stiffness, and myofascial relaxation. (Ensure a towel barrier; avoid over acute inflammation or numb skin).',
  },
  {
    id: 'cold_pack',
    label: 'Cold Pack / Ice Therapy',
    shortLabel: 'Cold Pack (10–15 min)',
    text: 'Cold pack application with a damp cloth or towel barrier for 10–15 minutes, 3–4 times daily during acute pain flares, swelling, or joint effusion. (Do not apply ice directly to bare skin).',
  },
  {
    id: 'cold_pack_post_procedure',
    label: 'Cold Pack Post-Procedure',
    shortLabel: 'Cold Pack (Post-Proc: 3x/day for 3 days)',
    text: 'Cold pack application over procedure/injection site for 10–15 minutes with a clean cloth barrier, 3 times a day for 3 days to minimize procedure-site soreness and inflammatory flare.',
  },
  {
    id: 'alternate_contrast',
    label: 'Alternate Contrast Therapy',
    shortLabel: 'Alternate Contrast (3m Hot / 1m Cold)',
    text: 'Alternate contrast therapy: 3–4 minutes warm/hot followed by 1 minute cold, repeated for 3–4 cycles (always end with cold if swelling is present, or warm if stiffness predominates) to stimulate microcirculation and resolve persistent edema.',
  },
];

export const MANAGEMENT_PROTOCOLS: Record<string, ManagementProtocol> = {
  knee: {
    id: 'knee',
    name: 'Knee Osteoarthritis & Patellofemoral Pain',
    conditionDescription: 'Degenerative joint disease, patellofemoral pain syndrome, or chronic knee inflammation',
    thermalAdvice: {
      hotPack: 'Hot pack for 15–20 minutes before morning exercises to loosen stiff knee periarticular tissues.',
      coldPack: 'Cold pack for 10–15 minutes (with towel barrier) after prolonged walking or standing to control joint effusion and inflammation.',
      coldPackPostProcedure: 'Post-procedure cold pack over injection site: 10–15 minutes with a clean towel, 3 times a day for 3 days.',
      alternateContrast: 'Alternate contrast bath (warm 3 mins / cold 1 min x 3 cycles) for chronic knee effusion with stiffness.',
    },
    physiotherapy: {
      protocolName: 'Quadriceps / VMO Conditioning & Joint Protection Protocol',
      exercises: [
        'Quadriceps and VMO (Vastus Medialis Oblique) strengthening: Isometric quad sets with rolled towel under knee (hold 10s x 10 reps, 3 sets daily)',
        'Straight Leg Raises (SLR) in supine position with toes pointing slightly outward to selectively bias VMO recruitment',
        'Terminal Knee Extension (TKE) in standing using an elastic resistance band (0° to 30° terminal arc)',
        'Hamstring and gastrocnemius gentle passive stretching (hold 30s x 3 sets)',
        'Hip abductor (Gluteus Medius) conditioning (side-lying leg raises, clamshells) to eliminate dynamic knee valgus collapse',
        'Low-impact closed-chain aerobic conditioning: Stationary cycling (saddle raised to minimize knee flexion angle) and aquatic/pool walking',
      ],
      precautions: [
        'STRICTLY AVOID deep squatting (>60° knee bend), deep lunges, and repetitive stair climbing during acute flares',
        'AVOID sitting cross-legged on the floor (palapathi/sukhasana) or kneeling on hard surfaces',
        'Avoid high-impact jumping, running, or sudden twisting pivot movements on weight-bearing knee',
      ],
    },
    yoga: {
      asanas: [
        'Tadasana (Mountain Pose) with block between thighs: Restores lower extremity mechanical axis and bilateral weight distribution',
        'Modified Virabhadrasana II (Warrior II): Gentle knee loading with strict alignment (knee directly above ankle, no inward valgus drop)',
        'Setu Bandhasana (Supported Bridge Pose with bolster): Gluteal and hamstring conditioning with zero shear on knee joint',
        'Supta Padangusthasana with yoga strap: Gentle hamstring lengthening without knee joint axial compression',
        'Dandasana (Staff Pose): Active isometric quad engagement against floor',
      ],
      pranayama: [
        'Nadi Shodhana Pranayama (Alternate Nostril Breathing): 5–10 minutes daily for systemic pain threshold modulation and stress relief',
        'Ujjayi Pranayama: Calming nervous system tone during gentle physical conditioning',
      ],
      precautions: [
        'STRICTLY CONTRAINDICATED: Padmasana (Full Lotus), Vajrasana, and deep kneeling postures',
        'Do not force knee into extreme passive flexion or rotation',
      ],
    },
    nonInvasiveAdvice: [
      'Weight Optimization & Unloading: Note that every 1 kg reduction in body weight unloads ~4 kg of compressive stress from the knee joint during each walking stride (Messier et al.)',
      'Footwear & Biomechanics: Use well-cushioned shock-absorbing footwear with neutral arch support; avoid high heels or worn-out soles',
      'Joint Protection: Use elevator or escalator when possible; on stairs, lead with the unaffected leg going up and the affected leg going down ("up with the good, down with the bad")',
      'Supportive Bracing: Wear a patellar tracking sleeve or unloader knee brace during extended walking or community ambulation',
      'TENS Unit Protocol: Conventional high-frequency TENS (80–100 Hz, 60–100 µs pulse duration) 30–45 minutes over medial/lateral joint lines for non-pharmacological pain gating',
    ],
  },

  lumbar: {
    id: 'lumbar',
    name: 'Lumbar Spine, Disc Herniation & Sciatica',
    conditionDescription: 'Lumbosacral radiculopathy, discogenic low back pain, spinal stenosis, facet arthropathy, or SI joint pain',
    thermalAdvice: {
      hotPack: 'Moist heat pack for 15–20 minutes over lumbar paraspinals to relieve secondary muscular spasm and morning stiffness.',
      coldPack: 'Cold pack with towel barrier for 10–15 minutes over lumbosacral region for acute radicular flare-ups or after prolonged sitting.',
      coldPackPostProcedure: 'Post-procedure cold pack over spine injection site: 10–15 minutes with a clean cloth barrier, 3 times a day for 3 days.',
      alternateContrast: 'Contrast therapy (3 min hot / 1 min cold x 3 cycles) for chronic persistent lumbosacral aching.',
    },
    physiotherapy: {
      protocolName: 'Lumbo-Pelvic Motor Control & Directional Preference Protocol',
      exercises: [
        'Directional preference exercises: McKenzie prone press-ups/extensions for posterior disc prolapse (stop if peripheralizing into leg)',
        'Core motor control: Transversus abdominis drawing-in maneuver and lumbar multifidus isometric activation',
        'Quadruped "Bird-Dog" exercises (maintaining stable neutral lumbar spine without hyperextension)',
        'Sciatic nerve flossing / neural mobilization: Gentle seated sliders (chin up with knee extension, avoiding aggressive tensioning)',
        'Gentle hamstring and piriformis stretching without lumbar spine flexion',
        'Cat-Camel gentle active lumbar segmental mobilization in quadruped position',
      ],
      precautions: [
        'AVOID heavy forward spinal flexion, especially when lifting loads or early in the morning when discs are hyperhydrated',
        'AVOID simultaneous flexion and axial spinal rotation (lifting while twisting)',
        'Avoid prolonged unbroken sitting >30–45 minutes; utilize sit-to-stand transitions',
      ],
    },
    yoga: {
      asanas: [
        'Bhujangasana (Gentle Sphinx / Cobra Pose): Restores physiological lumbar lordosis and promotes anterior disc pressure shifting',
        'Shalabhasana (Gentle Half-Locust Pose): Strengthens lumbar extensor paraspinals and gluteal musculature',
        'Setu Bandhasana (Supported Bridge Pose with block): Stabilizes lumbo-pelvic core with neutral spine',
        'Marjaryasana-Bitilasana (Cat-Cow): Segmental spinal mobility within pain-free comfort range',
        'Balasana (Extended Child’s Pose with wide knees): Relieves lumbar extensor tension (if flexion-tolerant)',
      ],
      pranayama: [
        'Bhramari Pranayama: 5–7 rounds for calming central nervous system hypersensitivity',
        'Diaphragmatic Breathing in semi-Fowler position: Reduces intra-abdominal pressure spikes and down-regulates paraspinal muscle splinting',
      ],
      precautions: [
        'AVOID Paschimottanasana (seated deep forward bend) and standing forward folds in acute disc herniation',
        'Avoid extreme spinal twists (Ardha Matsyendrasana) during acute sciatica',
      ],
    },
    nonInvasiveAdvice: [
      'Ergonomic Sleeping Posture: Medium-firm mattress; sleep on your side with a pillow between knees, or supine with a supportive pillow under knees to flatten hyperlordotic stress',
      'Bed Transfers: Use the "Log-roll" technique (roll shoulders and hips simultaneously as a single unit onto side before swinging legs off bed)',
      'Lifting Biomechanics: Bend at hips and knees (squat lift), hold object close to chest, and avoid twisting the torso',
      'Supportive Lumbar Belt: Use a semi-rigid lumbosacral support belt ONLY during long travel or heavy activity (avoid continuous 24/7 wear to prevent paraspinal deconditioning)',
      'Pain Neuroscience Education: Reassure that disc findings on MRI are common and hurt does not equal tissue harm; active movement prevents chronic disability',
    ],
  },

  cervical: {
    id: 'cervical',
    name: 'Cervical Spine & Radiculopathy',
    conditionDescription: 'Cervicalgia, cervical radicular arm pain, or cervicogenic headache/neck spasm',
    thermalAdvice: {
      hotPack: 'Moist heat pack for 15 minutes over trapezius and suboccipital region for myofascial spasm and postural tightness.',
      coldPack: 'Ice pack with cloth barrier for 10–12 minutes over lateral neck for acute nerve root inflammation or radicular pain spikes.',
      coldPackPostProcedure: 'Post-procedure cold pack over cervical injection site: 10–15 minutes with a clean barrier, 3 times a day for 3 days.',
      alternateContrast: 'Alternate contrast therapy for chronic periscapular and cervical aching.',
    },
    physiotherapy: {
      protocolName: 'Craniocervical Flexor & Scapulothoracic Stabilization Protocol',
      exercises: [
        'Deep neck flexor activation: Supine craniocervical flexion / gentle chin tucks (nodding motion holding 5–10 seconds)',
        'Scapular retractions and lower trapezius activation (prone cobra / wall angels)',
        'Cervical isometric strengthening: Submaximal resisted flexion, extension, and lateral side-bending in neutral posture',
        'Upper limb neurodynamic sliders (median, ulnar, and radial nerve flossing within pain-free boundaries)',
        'Pectoral doorway stretch to reverse rounded-shoulder forward-head posture',
      ],
      precautions: [
        'AVOID rapid neck jerking, aggressive hyperextension, or self-manipulation/cracking of the cervical spine',
        'Avoid prolonged downward neck flexion ("text neck" looking down at phone or laptop)',
      ],
    },
    yoga: {
      asanas: [
        'Tadasana (Mountain Pose with axial spine elongation): Establishes neutral cervical alignment',
        'Gomukhasana Arms (using a strap): Releases pectoralis minor and opens periscapular girdle without neck strain',
        'Matsyasana (Restorative Supported Fish with blocks under thoracic spine): Passively opens anterior chest wall',
        'Virasana with shoulder rolls: Releases levator scapulae and upper trapezius tightness',
      ],
      pranayama: [
        'Nadi Shodhana Pranayama: 10 minutes daily for autonomic calming and cervical tension relief',
        'Sheetali / Sheetkari: Cooling breaths for neuropathic burning cervicalgia',
      ],
      precautions: [
        'STRICTLY CONTRAINDICATED: Sirsasana (Headstand), Sarvangasana (Shoulderstand), and Halasana (Plow)',
      ],
    },
    nonInvasiveAdvice: [
      'Ergonomic Workstation Setup: Computer monitor top at eye level, elbows supported at 90°, keyboard close to torso, avoid cradling phone between ear and shoulder',
      'Cervical Pillow: Use an anatomical contoured memory foam pillow that maintains neutral neck alignment (neither hyperflexed nor hyperextended)',
      'Micro-break Rule: Every 30–45 minutes of desk work, perform 5 chin tucks and 5 scapular retractions',
      'Avoid heavy shoulder bags or backpacks carried on one side; use dual-strap backpacks or wheeled luggage',
    ],
  },

  shoulder: {
    id: 'shoulder',
    name: 'Shoulder Impingement & Rotator Cuff / Capsulitis',
    conditionDescription: 'Rotator cuff tendinopathy, subacromial impingement, or adhesive capsulitis (frozen shoulder)',
    thermalAdvice: {
      hotPack: 'Moist hot pack for 15–20 minutes over anterior/lateral shoulder before gentle stretching.',
      coldPack: 'Cold pack with towel barrier for 10–15 minutes after shoulder exercises or overhead tasks.',
      coldPackPostProcedure: 'Post-procedure cold pack over shoulder injection site: 10–15 minutes, 3 times a day for 3 days.',
      alternateContrast: 'Alternate contrast therapy for chronic adhesive capsulitis stiffness.',
    },
    physiotherapy: {
      protocolName: 'Rotator Cuff & Scapular Dyskinesis Rehabilitation Protocol',
      exercises: [
        'Codman’s pendulum exercises: Relaxed passive arm oscillation in circles and forward/backward planes (1–2 minutes)',
        'Active-assisted range of motion (AAROM): Using a cane or broomstick for forward elevation and external rotation in supine position',
        'Rotator cuff submaximal isometrics: External and internal rotation against a wall with elbow tucked at 90°',
        'Scapular stabilization: Wall slides with serratus anterior push, resistance band scapular rows',
        'Posterior capsule cross-body stretch: Gently pulling affected arm across chest with opposite hand',
      ],
      precautions: [
        'AVOID lifting heavy objects with outstretched arms or repetitive overhead reaching during acute impingement',
        'Do not force aggressive passive stretching through sharp pain ("sharp pinch = tissue impingement")',
      ],
    },
    yoga: {
      asanas: [
        'Garudasana Arms (Eagle Arms): Gently stretches infraspinatus, teres minor, and rhomboids',
        'Urdhva Hastasana within pain-free arc: Supported gentle overhead elevation',
        'Shashankasana (Hare Pose with arms supported on floor): Decompresses glenohumeral joint',
      ],
      pranayama: [
        'Diaphragmatic breathing to prevent accessory shoulder hiking / upper trapezius overactivity',
      ],
      precautions: [
        'AVOID Chaturanga Dandasana (four-limbed staff push-up) and Downward Dog during active impingement',
      ],
    },
    nonInvasiveAdvice: [
      'Sleeping Support: Never sleep directly on the affected shoulder; sleep on the opposite side with a pillow supporting the affected arm in front of the chest',
      'Carry objects close to the body with elbows bent rather than with arms extended',
      'Apply TENS over anterior and posterior shoulder joint line for 30 minutes for pain relief before rehabilitation sessions',
    ],
  },

  head_face: {
    id: 'head_face',
    name: 'Headache, Orofacial & Trigeminal Pain',
    conditionDescription: 'Trigeminal neuralgia, migraine, cervicogenic headache, or temporomandibular joint (TMJ) dysfunction',
    thermalAdvice: {
      hotPack: 'Warm moist compress over masseter/TMJ area and suboccipital region for muscle tension and cervicogenic headaches.',
      coldPack: 'Cold ice pack over temple, forehead, or occiput for 10–15 minutes for acute migraine or trigeminal paroxysms.',
      coldPackPostProcedure: 'Post-procedure cold compress over facial/cranial block site: 10 minutes with towel barrier, 3 times a day for 3 days.',
      alternateContrast: 'Gentle facial thermal pacing avoiding extreme cold shock on trigeminal trigger zones.',
    },
    physiotherapy: {
      protocolName: 'Cervico-Mandibular & Suboccipital Release Protocol',
      exercises: [
        'Rocabado 6x6 TMJ exercises: Rest tongue on roof of mouth (palatal "cluck" position), controlled midline jaw opening without lateral deviation',
        'Suboccipital myofascial release: Gentle chin retraction combined with gentle upper cervical flexion',
        'Gentle masseter and temporalis muscle ischemic compression and passive jaw stretching',
        'Isometric cervical spine stabilization in neutral alignment',
      ],
      precautions: [
        'AVOID chewy foods, hard candies, chewing gum, and wide yawning during TMJ acute exacerbations',
        'Avoid resting chin on hands or clenching teeth during stress (maintain "teeth apart, lips together")',
      ],
    },
    yoga: {
      asanas: [
        'Shavasana in a dark, quiet room with eye pillow: Deep sensory deprivation and autonomic recalibration',
        'Balasana (Child’s Pose) with forehead resting comfortably on a folded blanket: Relieves suboccipital tension',
        'Supported Viparita Karani (Legs-Up-The-Wall): Enhances venous return and down-regulates sympathetic surge',
      ],
      pranayama: [
        'Bhramari Pranayama (Humming Bee Breath): 5–10 minutes daily (vibrational resonance elevates local nitric oxide and stimulates vagus nerve)',
        'Sheetali / Sheetkari: Cooling breathing technique for burning facial neuropathic sensations',
      ],
      precautions: [
        'AVOID rapid breathing techniques (Kapalbhati or Bhastrika) which may trigger hyperventilation migraines',
      ],
    },
    nonInvasiveAdvice: [
      'Maintain regular sleep-wake schedule (7–8 hours) and consistent meal times to prevent metabolic migraine triggers',
      'Hydration: Drink at least 2.5–3 liters of water daily; avoid excessive caffeine swings or sudden caffeine withdrawal',
      'Ergonomics: Keep computer monitor at eye level to prevent forward head extension and suboccipital nerve compression',
      'Stress Reduction: Practice 4-7-8 diaphragmatic breathing or progressive muscle relaxation at the onset of headache aura',
    ],
  },

  neuropathic: {
    id: 'neuropathic',
    name: 'Neuropathic Pain Syndrome & CRPS',
    conditionDescription: 'Peripheral neuropathy, post-herpetic neuralgia, radiculopathy, or Complex Regional Pain Syndrome',
    thermalAdvice: {
      hotPack: 'Gentle warm pack (tepid warmth) for 15 minutes to improve local microcirculation in stiff or cold neuropathic limbs.',
      coldPack: 'Cool pack (avoid freezing cold) with thick towel barrier for 10 minutes if burning pain is predominant (caution in CRPS with cold allodynia).',
      coldPackPostProcedure: 'Post-procedure cold compress over nerve block site: 10–15 minutes with a clean cloth barrier, 3 times a day for 3 days.',
      alternateContrast: 'Contrast hydrotherapy (3 min warm / 1 min cool x 3 cycles) to retrain dysregulated vasomotor tone and reduce autonomic edema in CRPS.',
    },
    physiotherapy: {
      protocolName: 'Graded Motor Imagery (GMI) & Somatosensory Retraining Protocol',
      exercises: [
        'Graded Motor Imagery Stage 1: Implicit laterality recognition (identifying left vs right limb images on flashcards or app)',
        'Graded Motor Imagery Stage 2: Explicit imagined motor movements (imagining smooth limb movement without actual muscle contraction)',
        'Graded Motor Imagery Stage 3: Mirror therapy (performing synchronous bilateral movements while looking at the reflection of the unaffected limb)',
        'Tactile desensitization protocol: Rubbing affected skin with progressively graded textures (silk -> velvet -> cotton -> terrycloth towel -> gentle vibration) 5 mins, 3–4 times daily',
        'Gentle active weight-bearing and functional daily limb engagement (avoiding protective immobilization)',
      ],
      precautions: [
        'STRICTLY AVOID complete immobilization of the affected limb in a sling or cast (promotes central disuse atrophy and worsens CRPS)',
        'Do not force exercises through unbearable allodynia; proceed in graded tolerable increments',
      ],
    },
    yoga: {
      asanas: [
        'Yoga Nidra (Somatic Guided Body Scan): 20–30 minutes daily to recalibrate cortical sensory representation and down-regulate central sensitization',
        'Supported Viparita Karani (Legs-up-the-wall with pelvic bolster): Reduces limb edema and soothes sympathetically-mediated pain',
        'Gentle seated Suhasana with mindful breathing',
      ],
      pranayama: [
        'Slow coherent diaphragmatic breathing (5.5 breaths per minute) to stimulate cardiac vagal tone and down-regulate sympathetic vasomotor spasm',
        'Nadi Shodhana Pranayama for neural equilibrium',
      ],
      precautions: [
        'Avoid vigorous hot yoga or rapid posture changes that cause dramatic blood pressure or temperature shifts',
      ],
    },
    nonInvasiveAdvice: [
      'Wear loose-fitting soft cotton or seamless clothing to prevent fabric friction and dynamic mechanical allodynia',
      'Daily foot inspection and protective cushioned diabetic footwear if diabetic peripheral neuropathy is present',
      'TENS Therapy: Conventional high-frequency (80–100 Hz, 50–80 µs) applied proximal to the pain site or on contralateral dermatome for sensory gating',
      'Pacing: Break physical tasks into 15–20 minute segments to prevent evening post-exertional neuropathic burning flares',
    ],
  },

  widespread: {
    id: 'widespread',
    name: 'Fibromyalgia & Chronic Widespread Pain',
    conditionDescription: 'Central sensitization syndrome, widespread myofascial pain, or fibromyalgia',
    thermalAdvice: {
      hotPack: 'Moist heat or warm shower/bath (36–38°C) for 15–20 minutes in the morning to decrease generalized stiffness and hyperalgesia.',
      coldPack: 'Mild cold pack over localized myofascial flare zones for 10 minutes (only if tolerated; avoid if cold-hypersensitive).',
      coldPackPostProcedure: 'Post-procedure cold compress over trigger point or injection sites: 10–15 minutes, 3 times a day for 3 days.',
      alternateContrast: 'Alternate contrast warm/cool sponge application for sluggish circulation.',
    },
    physiotherapy: {
      protocolName: 'Graded Aerobic Conditioning & Energy Pacing Protocol',
      exercises: [
        'Graded Exercise Therapy (GET): Begin with 5–10 minutes of low-impact walking, recumbent cycling, or elliptical at comfortable conversational pace',
        'Progress exercise duration by no more than 10% per week to avoid triggering post-exertional symptom exacerbation ("pacing over push-crash cycles")',
        'Warm water hydrotherapy / pool exercise (32–34°C) for low-impact resistance and generalized buoyancy',
        'Gentle full-body range-of-motion stretches combined with slow exhalations (no aggressive ballistic stretching)',
      ],
      precautions: [
        'AVOID the "boom-and-bust" cycle (doing too much on good days and crashing for days afterwards)',
        'Avoid high-intensity interval training (HIIT) or heavy eccentric resistance during active flare-ups',
      ],
    },
    yoga: {
      asanas: [
        'Restorative Yoga: Supta Baddha Konasana (Reclining Bound Angle) with bolsters and blankets supporting knees and spine',
        'Supported Balasana (Child’s Pose over a large bolster)',
        'Viparita Karani (Legs-Up-The-Wall Pose) for lymphatic drainage and calming nervous system hyperarousal',
        'Shavasana with guided progressive muscle relaxation',
      ],
      pranayama: [
        'Bhramari Pranayama: 5–10 minutes before bedtime to facilitate restorative deep sleep onset',
        'Deep diaphragmatic 4-7-8 breathing for parasympathetic down-regulation',
      ],
      precautions: [
        'Avoid competitive or power yoga styles (Ashtanga, Bikram); focus strictly on gentle restorative practice',
      ],
    },
    nonInvasiveAdvice: [
      'Pain Neuroscience Education (PNE): Understand that the nervous system volume dial is turned up (central sensitization), and pain does not mean ongoing structural damage',
      'Sleep Hygiene: Strict sleep schedule, bedroom dark and cool, avoid screens/blue light 60 minutes before bedtime, avoid late caffeine or alcohol',
      'Activity Pacing: Plan daily schedule with built-in 10-minute rest intervals between tasks to conserve energetic reserves',
      'Cognitive & Somatic Calming: Utilize mindfulness-based stress reduction (MBSR) and diaphragmatic breathing during symptom spikes',
    ],
  },
};

/**
 * Matches a diagnosis code, text, or location to the best management protocol.
 */
export function getManagementProtocol(
  diagnosisCode: string = '',
  diagnosisText: string = '',
  painLocation: string = '',
  isProcedure: boolean = false
): ManagementProtocol {
  const code = diagnosisCode.trim().toUpperCase();
  const text = diagnosisText.trim().toLowerCase();
  const loc = painLocation.trim().toLowerCase();

  // 1. Knee OA (Primary match on knee keywords or FA00)
  if (
    code.startsWith('FA00') ||
    text.includes('knee') ||
    text.includes('gonarthrosis') ||
    text.includes('patellofemoral') ||
    text.includes('menisc') ||
    loc === 'knee'
  ) {
    return MANAGEMENT_PROTOCOLS.knee;
  }

  // 2. Lumbar / Low back / Sciatica
  if (
    code.startsWith('ME84') ||
    code.startsWith('FA02') ||
    code.startsWith('8B41') ||
    text.includes('back') ||
    text.includes('lumbar') ||
    text.includes('sciatica') ||
    text.includes('disc') ||
    text.includes('pivd') ||
    text.includes('stenosis') ||
    text.includes('sacroiliac') ||
    text.includes('sij') ||
    loc === 'lumbar'
  ) {
    return MANAGEMENT_PROTOCOLS.lumbar;
  }

  // 3. Cervical / Neck
  if (
    code.startsWith('ME82') ||
    code.startsWith('FA03') ||
    code.startsWith('8B40') ||
    text.includes('neck') ||
    text.includes('cervical') ||
    text.includes('brachialgia') ||
    text.includes('cervicogenic') ||
    loc === 'cervical'
  ) {
    return MANAGEMENT_PROTOCOLS.cervical;
  }

  // 4. Shoulder
  if (
    text.includes('shoulder') ||
    text.includes('rotator') ||
    text.includes('capsulit') ||
    text.includes('impingement') ||
    loc === 'shoulder'
  ) {
    return MANAGEMENT_PROTOCOLS.shoulder;
  }

  // 5. Head / Orofacial
  if (
    code.startsWith('8B82') ||
    code.startsWith('MG30.03') ||
    text.includes('trigeminal') ||
    text.includes('headache') ||
    text.includes('migraine') ||
    text.includes('tmj') ||
    text.includes('facial')
  ) {
    return MANAGEMENT_PROTOCOLS.head_face;
  }

  // 6. Neuropathic / CRPS
  if (
    code.startsWith('MG30.4') ||
    code.startsWith('8C00') ||
    text.includes('neuropath') ||
    text.includes('crps') ||
    text.includes('phn') ||
    text.includes('postherpetic') ||
    text.includes('diabetic neuro') ||
    loc === 'neuropathic'
  ) {
    return MANAGEMENT_PROTOCOLS.neuropathic;
  }

  // 7. Widespread / Fibromyalgia
  if (
    code.startsWith('MG30.0') ||
    code.startsWith('FB56') ||
    text.includes('fibromyalgia') ||
    text.includes('widespread') ||
    loc === 'widespread'
  ) {
    return MANAGEMENT_PROTOCOLS.widespread;
  }

  // Fallback default: Lumbar or Knee based on location
  return loc === 'knee' ? MANAGEMENT_PROTOCOLS.knee : MANAGEMENT_PROTOCOLS.lumbar;
}

/**
 * Builds a comprehensive, formatted summary text of the non-invasive management protocol
 * ready to be inserted directly into the encounter notes or printable prescription.
 */
export function buildCompleteProtocolSummary(
  protocolKey: string,
  isProcedure: boolean = false
): string {
  const proto = MANAGEMENT_PROTOCOLS[protocolKey] || MANAGEMENT_PROTOCOLS.lumbar;
  const sections: string[] = [];

  sections.push(`📋 NON-INVASIVE & CONSERVATIVE MANAGEMENT: ${proto.name.toUpperCase()}`);

  // Thermal advice
  const thermalLines = [
    `• Hot Pack: ${proto.thermalAdvice.hotPack}`,
    `• Cold Pack: ${proto.thermalAdvice.coldPack}`,
    isProcedure || proto.thermalAdvice.coldPackPostProcedure
      ? `• Post-Procedure Cold Pack: ${proto.thermalAdvice.coldPackPostProcedure || 'Apply cold pack with towel barrier for 10–15 mins, 3 times a day for 3 days over procedure site.'}`
      : null,
    `• Alternate (Contrast Therapy): ${proto.thermalAdvice.alternateContrast}`,
  ].filter(Boolean);
  sections.push(`\n[ Conservative Thermal Modalities ]\n${thermalLines.join('\n')}`);

  // Physiotherapy
  const physioLines = [
    ...proto.physiotherapy.exercises.map((ex) => `• ${ex}`),
    ...proto.physiotherapy.precautions.map((pr) => `⚠️ ${pr}`),
  ];
  sections.push(`\n[ Physiotherapy: ${proto.physiotherapy.protocolName} ]\n${physioLines.join('\n')}`);

  // Yoga & Mind-Body
  const yogaLines = [
    `• Recommended Asanas: ${proto.yoga.asanas.join('; ')}`,
    `• Pranayama / Breathing: ${proto.yoga.pranayama.join('; ')}`,
    ...proto.yoga.precautions.map((pr) => `⚠️ ${pr}`),
  ];
  sections.push(`\n[ Yoga & Mind-Body Protocols ]\n${yogaLines.join('\n')}`);

  // Evidence-Based Advice & Lifestyle
  const adviceLines = proto.nonInvasiveAdvice.map((ad) => `• ${ad}`);
  sections.push(`\n[ Evidence-Based Non-Invasive Advice & Ergonomics ]\n${adviceLines.join('\n')}`);

  return sections.join('\n');
}


