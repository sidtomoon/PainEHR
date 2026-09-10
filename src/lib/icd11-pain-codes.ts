/**
 * ICD-11 codes most relevant to an interventional pain medicine OPD.
 *
 * Primary source: ICD-11 Chapter 21 — MG30 Chronic pain classification
 * (the first ICD edition to treat chronic pain as a diagnosis in its own right).
 * Supplemented with high-frequency codes from other chapters that this practice
 * sees daily (radiculopathy, trigeminal neuralgia, CRPS, etc.).
 *
 * Each entry carries a keywords array for fuzzy autocomplete matching — a user
 * typing "back" or "lumbar" should find MG30.02 and ME84 without needing to
 * know the code.
 *
 * This is deliberately a static client-importable file (not an API call) because
 * the list is small (~50 entries) and changes only when WHO publishes a new
 * ICD-11 revision.
 */

export interface Icd11Code {
  code: string;
  label: string;
  keywords: string[];
}

export const ICD11_PAIN_CODES: Icd11Code[] = [
  // ── MG30 Chronic pain (ICD-11 Chapter 21) ──────────────────────────
  { code: 'MG30.0', label: 'Chronic primary pain', keywords: ['primary', 'fibromyalgia', 'nonspecific', 'idiopathic'] },
  { code: 'MG30.00', label: 'Chronic widespread pain', keywords: ['widespread', 'fibromyalgia', 'diffuse', 'whole body'] },
  { code: 'MG30.01', label: 'Chronic primary musculoskeletal pain', keywords: ['musculoskeletal', 'MSK', 'joint', 'muscle'] },
  { code: 'MG30.02', label: 'Chronic primary visceral pain', keywords: ['visceral', 'abdominal', 'pelvic', 'organ'] },
  { code: 'MG30.03', label: 'Chronic primary headache or orofacial pain', keywords: ['headache', 'migraine', 'facial', 'orofacial', 'TMJ'] },
  { code: 'MG30.1', label: 'Chronic cancer-related pain', keywords: ['cancer', 'malignancy', 'oncologic', 'tumour', 'tumor'] },
  { code: 'MG30.10', label: 'Chronic cancer pain', keywords: ['cancer', 'tumour', 'tumor', 'malignant'] },
  { code: 'MG30.11', label: 'Chronic post-cancer treatment pain', keywords: ['post-chemo', 'post-radiation', 'post-surgery cancer', 'survivorship'] },
  { code: 'MG30.2', label: 'Chronic postsurgical or post-traumatic pain', keywords: ['postsurgical', 'post-traumatic', 'CPSP', 'scar', 'surgery'] },
  { code: 'MG30.20', label: 'Chronic postsurgical pain', keywords: ['postsurgical', 'post-operative', 'CPSP'] },
  { code: 'MG30.21', label: 'Chronic post-traumatic pain', keywords: ['post-traumatic', 'injury', 'accident', 'trauma'] },
  { code: 'MG30.3', label: 'Chronic secondary musculoskeletal pain', keywords: ['musculoskeletal', 'arthritis', 'degenerative', 'spondylosis'] },
  { code: 'MG30.30', label: 'Chronic secondary musculoskeletal pain from persistent inflammation', keywords: ['inflammatory', 'RA', 'rheumatoid', 'ankylosing'] },
  { code: 'MG30.31', label: 'Chronic secondary musculoskeletal pain from structural changes', keywords: ['structural', 'OA', 'osteoarthritis', 'disc', 'spondylosis', 'stenosis'] },
  { code: 'MG30.32', label: 'Chronic secondary musculoskeletal pain from disease of nervous system', keywords: ['spasticity', 'parkinsonism', 'neurological MSK'] },
  { code: 'MG30.4', label: 'Chronic neuropathic pain', keywords: ['neuropathic', 'nerve', 'burning', 'shooting', 'neuropathy'] },
  { code: 'MG30.40', label: 'Chronic central neuropathic pain', keywords: ['central', 'spinal cord', 'stroke', 'MS', 'thalamic'] },
  { code: 'MG30.41', label: 'Chronic peripheral neuropathic pain', keywords: ['peripheral', 'DPN', 'diabetic', 'PHN', 'postherpetic', 'entrapment'] },
  { code: 'MG30.5', label: 'Chronic secondary headache or orofacial pain', keywords: ['headache', 'secondary headache', 'TMD', 'orofacial'] },
  { code: 'MG30.6', label: 'Chronic secondary visceral pain', keywords: ['visceral', 'IBS', 'endometriosis', 'chronic pancreatitis'] },
  { code: 'MG30.60', label: 'Chronic secondary visceral pain from mechanical factors', keywords: ['obstruction', 'adhesion', 'mechanical visceral'] },
  { code: 'MG30.61', label: 'Chronic secondary visceral pain from vascular mechanisms', keywords: ['ischaemic', 'mesenteric', 'vascular visceral'] },
  { code: 'MG30.62', label: 'Chronic secondary visceral pain from persistent inflammation', keywords: ['inflammatory bowel', 'IBD', 'pancreatitis', 'cystitis'] },

  // ── High-frequency non-MG30 codes seen in pain OPD ─────────────────
  { code: 'ME84', label: 'Low back pain', keywords: ['LBP', 'low back', 'lumbar', 'lumbago', 'backache'] },
  { code: 'ME84.0', label: 'Low back pain with sciatica', keywords: ['sciatica', 'radicular', 'leg pain', 'lumbar radiculopathy'] },
  { code: 'ME84.2', label: 'Low back pain, non-specific', keywords: ['nonspecific', 'mechanical', 'NSLBP'] },
  { code: 'ME82', label: 'Cervicalgia', keywords: ['neck pain', 'cervical', 'cervicalgia'] },
  { code: 'FA02', label: 'Lumbar disc herniation', keywords: ['disc', 'herniation', 'prolapse', 'PIVD', 'lumbar disc'] },
  { code: 'FA03', label: 'Cervical disc herniation', keywords: ['cervical disc', 'herniation', 'PIVD cervical'] },
  { code: 'FA80', label: 'Spinal stenosis', keywords: ['stenosis', 'canal narrowing', 'claudication', 'lumbar stenosis'] },
  { code: '8B82', label: 'Trigeminal neuralgia', keywords: ['trigeminal', 'TN', 'facial', 'tic douloureux'] },
  { code: '8C00.0', label: 'Postherpetic neuralgia', keywords: ['PHN', 'postherpetic', 'shingles', 'herpes zoster'] },
  { code: '8D8A.0', label: 'Complex regional pain syndrome type I', keywords: ['CRPS', 'RSD', 'reflex sympathetic', 'complex regional'] },
  { code: '8D8A.1', label: 'Complex regional pain syndrome type II', keywords: ['CRPS-II', 'causalgia', 'complex regional'] },
  { code: '8B40', label: 'Cervical radiculopathy', keywords: ['cervical radiculopathy', 'arm pain', 'nerve root cervical'] },
  { code: '8B41', label: 'Lumbosacral radiculopathy', keywords: ['lumbar radiculopathy', 'lumbosacral', 'nerve root lumbar', 'sciatica'] },
  { code: '8C0Y', label: 'Other specified mononeuropathy', keywords: ['mononeuropathy', 'nerve entrapment', 'carpal tunnel'] },
  { code: '5A14', label: 'Diabetic peripheral neuropathy', keywords: ['diabetic', 'DPN', 'diabetic neuropathy', 'peripheral neuropathy'] },
  { code: 'FB54.1', label: 'Sacroiliitis', keywords: ['SI joint', 'sacroiliac', 'sacroiliitis', 'SIJ'] },
  { code: 'FA70', label: 'Spondylosis', keywords: ['spondylosis', 'degenerative', 'osteophyte', 'DDD'] },
  { code: 'FB56.4', label: 'Myofascial pain syndrome', keywords: ['myofascial', 'trigger point', 'MPS', 'muscle pain'] },
  { code: 'MG30.Y', label: 'Other specified chronic pain', keywords: ['other', 'unspecified', 'NOS'] },
  { code: 'MG30.Z', label: 'Chronic pain, unspecified', keywords: ['unspecified', 'NOS', 'chronic pain'] },
];
