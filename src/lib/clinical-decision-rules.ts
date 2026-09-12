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

