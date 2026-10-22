'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { CdssPrompts } from './CdssPrompts';
import { DiagnosisCodeInput } from './DiagnosisCodeInput';
import { DirectedHistorySection } from './DirectedHistorySection';
import { ManagementProtocolsSection } from './ManagementProtocolsSection';
import { NonInvasiveRxBuilder } from './NonInvasiveRxBuilder';
import { ScoreSelector, PainRegimensBar } from './EncounterScoreComponents';
import { SmartPhrasesPicker } from '@/app/components/SmartPhrasesPicker';
import { updatePatientDemographics } from '@/app/patients/actions';
import { compressImage } from '@/lib/image-compress';
import {
  matchClinicalRule,
  isCancerDiagnosis,
  shouldCheckWidespreadPain,
  PAIN_SCORE_OPTIONS,
  FUNCTIONAL_IMPACT_OPTIONS,
} from '@/lib/clinical-decision-rules';
import {
  FUNCTIONAL_CHANGES, GOALS_OF_CARE, IMAGING_CONCORDANCES, PAIN_LOCATIONS,
  PAIN_MECHANISMS, PATIENT_GLOBAL_IMPRESSIONS, PROCEDURE_CATEGORIES, PROCEDURE_GUIDANCES,
  PROCEDURE_INTENTS,
} from '@/lib/types';
import type {
  CaptureSource, Encounter, EncounterConfidence, EncounterType, FunctionalChange, GoalOfCare,
  ImagingConcordance, PainLocation, PainMechanism, PatientGlobalImpression, ProcedureCategory,
  ProcedureGuidance, ProcedureIntent,
} from '@/lib/types';

const CONF_STYLES: Record<string, string> = {
  high: 'bg-teal-50 text-teal-700 border-teal-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-rose-50 text-rose-700 border-rose-200',
};

const COMMON_COMORBIDITIES = [
  'Hypertension',
  'Type 2 Diabetes',
  'CAD / IHD',
  'Hypothyroidism',
  'Prior Spine Surgery',
  'Prior Joint Arthroplasty',
  'Asthma / COPD',
  'CKD',
  'No major comorbidities',
  'NKDA (No known drug allergies)',
];

const COMMON_PAST_TREATMENTS = [
  'Oral NSAIDs',
  'Pregabalin / Gabapentin',
  'Tramadol / Weak Opioids',
  'Strong Opioids',
  'Physiotherapy / Rehab',
  'Epidural Steroid Injection',
  'Facet / MBB Block / RFA',
  'Joint Injections (Steroid/HA/PRP)',
  'Spine Surgery',
  'Minimal / transient relief',
];

type TriState = '' | 'yes' | 'no';

type Fields = {
  encounterType: EncounterType;
  chiefComplaint: string;
  diagnosis: string;
  diagnosisCode: string;
  painLocation: PainLocation | '';
  painScoreNrs: string;
  procedure: string;
  plan: string;
  notes: string;

  // New assessment fields
  painMechanism: PainMechanism | '';
  pastHistory: string;
  pastTreatments: string;
  functionalImpact: string;
  redFlags: string;
  diagnosisConfidence: '' | 'high' | 'medium' | 'low';
  imagingConcordance: ImagingConcordance | '';
  isCancerPain: TriState;
  cancerType: string;
  metastaticDisease: TriState;
  oncologicTreatment: string;
  goalOfCare: GoalOfCare | '';

  // Procedure visit
  procedureCategory: ProcedureCategory | '';
  procedureLevelLaterality: string;
  procedureGuidance: ProcedureGuidance | '';
  drugsUsed: string;
  procedureIntent: ProcedureIntent | '';
  immediatePainReliefNrs: string;
  immediateComplications: string;
  plannedFollowupInterval: string;

  // Procedure media link (OneDrive)
  procedureMediaType: string;
  procedureMediaTitle: string;
  procedureMediaUrl: string;

  // Follow-up visit
  functionalChange: FunctionalChange | '';
  reinterventionNeeded: TriState;
  learningPoint: string;

  // Outcomes (single-item proxies)
  functionScore: string;
  moodScore: string;
  sleepScore: string;
  qolScore: string;
  widespreadPain: TriState;
  patientGlobalImpression: PatientGlobalImpression | '';
  adverseEvent: string;
};

const BASE_EMPTY_FIELDS: Fields = {
  encounterType: 'new', chiefComplaint: '', diagnosis: '', diagnosisCode: '', painLocation: '',
  painScoreNrs: '', procedure: '', plan: '', notes: '',
  painMechanism: '', pastHistory: '', pastTreatments: '', functionalImpact: '', redFlags: '', diagnosisConfidence: '',
  imagingConcordance: '', isCancerPain: '', cancerType: '', metastaticDisease: '',
  oncologicTreatment: '', goalOfCare: '',
  procedureCategory: '', procedureLevelLaterality: '', procedureGuidance: '',
  drugsUsed: '', procedureIntent: '', immediatePainReliefNrs: '', immediateComplications: '',
  plannedFollowupInterval: '',
  procedureMediaType: 'procedure_video', procedureMediaTitle: '', procedureMediaUrl: '',
  functionalChange: '', reinterventionNeeded: '', learningPoint: '',
  functionScore: '', moodScore: '', sleepScore: '', qolScore: '',
  widespreadPain: '', patientGlobalImpression: '', adverseEvent: '',
};

type PriorEncounter = (Pick<
  Encounter,
  'chief_complaint' | 'diagnosis' | 'diagnosis_code' | 'pain_location' | 'pain_score_nrs'
>) | null;

export function CaptureFlow({
  patientId,
  patientName,
  patientCode,
  saveAction,
  priorEncounter,
  initialType = 'new',
}: {
  patientId: string;
  patientName: string;
  patientCode: string;
  saveAction: (formData: FormData) => void;
  priorEncounter: PriorEncounter;
  initialType?: EncounterType;
}) {
  function withCarryForward(base: Fields, targetType: EncounterType): Fields {
    if (!priorEncounter) return { ...base, encounterType: targetType };
    return {
      ...base,
      encounterType: targetType,
      chiefComplaint: base.chiefComplaint || priorEncounter.chief_complaint || '',
      diagnosis: base.diagnosis || priorEncounter.diagnosis || '',
      diagnosisCode: base.diagnosisCode || priorEncounter.diagnosis_code || '',
      painLocation: base.painLocation || priorEncounter.pain_location || '',
    };
  }

  const [step, setStep] = useState<'capture' | 'review'>('capture');
  const [captureMode, setCaptureMode] = useState<CaptureSource | null>(null);

  const [photos, setPhotos] = useState<Array<{
    id: string;
    name: string;
    file: File;
    preview: string;
    base64: string;
    mediaType: string;
    originalSize: number;
    compressedSize: number;
  }>>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [confidences, setConfidences] = useState<EncounterConfidence>({});
  const [fields, setFields] = useState<Fields>(() =>
    withCarryForward(BASE_EMPTY_FIELDS, initialType),
  );
  const [encounterDate, setEncounterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showEditBaseline, setShowEditBaseline] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [directedHistoryAnswers, setDirectedHistoryAnswers] = useState<Record<string, string[]>>({});

  // Scheduling
  const [scheduleType, setScheduleType] = useState<'' | 'followup' | 'procedure'>('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');

  // Retrospective Demographics from OPD Card
  const [extractedDemographics, setExtractedDemographics] = useState<{
    cr_no?: string | null;
    name?: string | null;
    age?: number | null;
    sex?: string | null;
    phone?: string | null;
  } | null>(null);
  const [demoCrNo, setDemoCrNo] = useState('');
  const [demoName, setDemoName] = useState('');
  const [demoAge, setDemoAge] = useState('');
  const [demoSex, setDemoSex] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [applyDemographics, setApplyDemographics] = useState(true);
  const [demographicsSavedNotice, setDemographicsSavedNotice] = useState<string | null>(null);

  async function handleInstantDemographicsUpdate() {
    setDemographicsSavedNotice('Updating chart…');
    try {
      const res = await updatePatientDemographics(patientId, {
        patient_code: demoCrNo || undefined,
        name: demoName || undefined,
        age: demoAge ? Number(demoAge) : undefined,
        sex: (demoSex as 'M' | 'F' | 'Other') || undefined,
        phone: demoPhone || undefined,
      });
      if (res.status === 'success') {
        setDemographicsSavedNotice('✓ Master patient chart updated successfully!');
      } else {
        setDemographicsSavedNotice(`Error: ${res.message}`);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setDemographicsSavedNotice(`Error: ${err?.message || 'Failed to update'}`);
    }
  }

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleAddAdviceToNotes(adviceText: string) {
    const cur = fields.notes ? fields.notes.trim() : '';
    if (!cur) {
      set('notes', adviceText);
    } else if (!cur.includes(adviceText.trim())) {
      set('notes', `${cur}\n${adviceText}`);
    }
  }

  function handleReplaceNotes(newNotes: string) {
    set('notes', newNotes);
  }

  const activeRule = matchClinicalRule(fields.diagnosisCode, fields.diagnosis);
  const isCancerDetected = isCancerDiagnosis(fields.diagnosisCode, fields.diagnosis);
  const isWidespreadCandidate = shouldCheckWidespreadPain(fields.diagnosisCode, fields.diagnosis);

  const [dismissCancerPrompt, setDismissCancerPrompt] = useState(false);
  const [manualShowCancer, setManualShowCancer] = useState(false);
  const [manualShowWidespread, setManualShowWidespread] = useState(false);

  // Auto-flag cancer pain when detected from initial diagnosis
  useEffect(() => {
    if (isCancerDetected && !dismissCancerPrompt) {
      if (fields.isCancerPain !== 'yes') {
        set('isCancerPain', 'yes');
      }
    }
  }, [isCancerDetected, dismissCancerPrompt, fields.isCancerPain]);

  const showCancerSection = (isCancerDetected && !dismissCancerPrompt) || manualShowCancer || fields.isCancerPain === 'yes';
  const showWidespreadSection = isWidespreadCandidate || manualShowWidespread || fields.widespreadPain === 'yes';

  // Auto-align location when a diagnosis matches a clinical rule
  useEffect(() => {
    if (activeRule && (!fields.painLocation || !activeRule.directedLocations.includes(fields.painLocation as PainLocation))) {
      set('painLocation', activeRule.defaultLocation);
    }
  }, [activeRule?.id]);

  const displayedLocations = activeRule && !showAllLocations
    ? activeRule.directedLocations
    : PAIN_LOCATIONS;

  async function handleAddPhotos(incomingFiles: FileList | File[] | null | undefined) {
    if (!incomingFiles) return;
    const filesArray = Array.from(incomingFiles).filter((f) => f && f.size > 0);
    if (filesArray.length === 0) return;

    setIsCompressing(true);
    try {
      const added: typeof photos = [];
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const compressed = await compressImage(file, 1600, 0.82);
        added.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name || `Photo ${photos.length + i + 1}`,
          file,
          preview: compressed.dataUrl,
          base64: compressed.base64,
          mediaType: compressed.mediaType,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        });
      }
      setPhotos((prev) => [...prev, ...added]);
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
    }
  }

  function handleRemovePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleClearAllPhotos() {
    setPhotos([]);
  }

  function startRecording() {
    type SpeechRecognitionLike = {
      continuous: boolean; interimResults: boolean; lang: string;
      onresult: ((e: unknown) => void) | null; onerror: (() => void) | null; onend: (() => void) | null;
      start: () => void; stop: () => void;
    };
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const e = event as { resultIndex: number; results: { isFinal: boolean; [i: number]: { transcript: string } }[] };
        let interim = '';
        let finalChunk = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            finalChunk += text + ' ';
          } else {
            interim += text;
          }
        }

        // Functional update ensures whatever the clinician manually typed or corrected
        // in the textarea is 100% PRESERVED, and new speech appends to the end
        if (finalChunk.trim()) {
          setTranscript((prev) => {
            const base = prev.trim();
            const addition = finalChunk.trim();
            return base ? `${base} ${addition}` : addition;
          });
        }
        setInterimSpeech(interim);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setInterimSpeech('');
      };
      recognition.onend = () => {
        setIsRecording(false);
        setInterimSpeech('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      setInterimSpeech('');
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimSpeech('');
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function appendPunctuation(symbol: string) {
    setTranscript((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return '';
      if (symbol === '\n') return `${trimmed}\n\n`;
      return `${trimmed}${symbol} `;
    });
  }

  function appendPhrase(phrase: string) {
    setTranscript((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return phrase;
      return `${trimmed}\n${phrase} `;
    });
  }

  async function runExtraction() {
    setIsExtracting(true);
    setExtractError(null);
    try {
      let body: Record<string, unknown>;
      if (captureMode === 'photo' && photos.length > 0) {
        body = {
          mode: 'photo',
          images: photos.map((p) => ({
            base64: p.base64,
            mediaType: p.mediaType,
            name: p.name,
          })),
        };
      } else {
        body = { mode: 'voice', transcript };
      }
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Check for extracted demographics from OPD card
      const demo = data.demographics;
      if (demo && (demo.cr_no || demo.name || demo.age || demo.sex || demo.phone)) {
        setExtractedDemographics(demo);
        if (demo.cr_no) setDemoCrNo(demo.cr_no);
        if (demo.name) setDemoName(demo.name);
        if (demo.age !== null && demo.age !== undefined) setDemoAge(String(demo.age));
        if (demo.sex) setDemoSex(demo.sex);
        if (demo.phone) setDemoPhone(demo.phone);
        setApplyDemographics(true);
        setDemographicsSavedNotice(null);
      }

      setFields(withCarryForward({
        ...BASE_EMPTY_FIELDS,
        encounterType: data.encounter_type || fields.encounterType,
        chiefComplaint: data.chief_complaint || '',
        diagnosis: data.diagnosis || '',
        diagnosisCode: fields.diagnosisCode || '',
        painLocation: data.pain_location || '',
        painScoreNrs: data.pain_score_nrs ?? '',
        procedure: data.procedure || '',
        plan: data.plan || '',
        notes: data.notes || '',
        functionScore: data.function_score_0_10 !== null && data.function_score_0_10 !== undefined ? String(data.function_score_0_10) : fields.functionScore,
        moodScore: data.mood_score_0_10 !== null && data.mood_score_0_10 !== undefined ? String(data.mood_score_0_10) : fields.moodScore,
        sleepScore: data.sleep_score_0_10 !== null && data.sleep_score_0_10 !== undefined ? String(data.sleep_score_0_10) : fields.sleepScore,
        qolScore: data.qol_score_0_10 !== null && data.qol_score_0_10 !== undefined ? String(data.qol_score_0_10) : fields.qolScore,
      }, data.encounter_type || fields.encounterType));
      setConfidences(data.confidence || {});
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : 'Something went wrong during extraction. You can still fill fields in manually below.');
    } finally {
      setIsExtracting(false);
      setStep('review');
    }
  }

  function skipToManualReview() {
    setExtractError(null);
    setConfidences({});
    setStep('review');
  }

  const canExtract = (captureMode === 'photo' && photos.length > 0) || (captureMode === 'voice' && transcript.trim().length > 0);

  if (step === 'capture') {
    const isFollowup = fields.encounterType === 'followup';
    const isProcedure = fields.encounterType === 'procedure';

    return (
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
        <Link href={`/patients/${patientId}`} className="text-xs text-slate-400 hover:text-slate-600">
          ← Patient Chart
        </Link>

        <div className="mt-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">
              {isFollowup ? 'Record Follow-up' : isProcedure ? 'Record Procedure' : 'New Patient Intake'}
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {patientCode}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Patient: <strong className="text-slate-700">{patientName}</strong>
            {priorEncounter?.diagnosis && (
              <span> · Diagnosis on file: <strong className="text-slate-700">{priorEncounter.diagnosis}</strong></span>
            )}
          </p>
        </div>

        {/* Quick direct entry button for fast clinic OPD */}
        <div className="mb-4">
          <button
            onClick={skipToManualReview}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-3 text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition"
          >
            <span>📝</span>
            <span>{isFollowup ? 'Enter Follow-up Data Directly' : isProcedure ? 'Enter Procedure Data Directly' : 'Enter Form Directly'}</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400 uppercase tracking-wider font-medium">or capture with AI</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div className="grid grid-cols-2 gap-3 my-3">
          <button
            onClick={() => setCaptureMode('photo')}
            className={`rounded-lg border px-4 py-3.5 text-sm font-medium transition ${captureMode === 'photo' ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            📷 Photo Note / Rx
          </button>
          <button
            onClick={() => setCaptureMode('voice')}
            className={`rounded-lg border px-4 py-3.5 text-sm font-medium transition ${captureMode === 'voice' ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            🎙️ Dictate Voice
          </button>
        </div>

        {captureMode === 'photo' && photos.length === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Live Camera Capture */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-teal-300 bg-teal-50/40 rounded-xl cursor-pointer hover:bg-teal-50 hover:border-teal-400 transition text-center group shadow-xs">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleAddPhotos(e.target.files)}
                  disabled={isCompressing}
                  className="hidden"
                />
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📸</span>
                <span className="text-sm font-semibold text-slate-800">Take Photo (Camera)</span>
                <span className="text-xs text-slate-500 mt-1">
                  Snap photo of OPD card, prescription slip, or note
                </span>
              </label>

              {/* Option 2: Upload from Photo Gallery or Files (supports selecting multiple photos!) */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition text-center group shadow-xs">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddPhotos(e.target.files)}
                  disabled={isCompressing}
                  className="hidden"
                />
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🖼️</span>
                <span className="text-sm font-semibold text-slate-800">Choose from Gallery / Files</span>
                <span className="text-xs text-slate-500 mt-1">
                  Select multiple photos (OPD ticket, Rx pages, lab scans)
                </span>
              </label>
            </div>

            {isCompressing && (
              <div className="text-xs text-center text-teal-800 bg-teal-50 border border-teal-200 rounded-lg p-2 font-medium animate-pulse">
                ⚡ Compressing image for ultra-fast AI upload…
              </div>
            )}

            <p className="text-[11px] text-center text-slate-400">
              Supports multiple photos · Client-side compressed 40x for lightning-fast Gemini extraction
            </p>
          </div>
        )}

        {captureMode === 'photo' && photos.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Attached Pages &amp; Photos ({photos.length})
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                  Compressed &bull; Fast Upload Ready
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearAllPhotos}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative group rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div className="aspect-4/3 w-full bg-slate-900/5 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.preview}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">Page {idx + 1}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {Math.round(item.compressedSize / 1024)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(item.id)}
                    className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow-md transition"
                    title="Remove page"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {isCompressing && (
              <div className="text-xs text-center text-teal-800 bg-teal-50 border border-teal-200 rounded-lg p-2 font-medium animate-pulse">
                ⚡ Compressing new page…
              </div>
            )}

            {/* Quick Add More Pages Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <label className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-teal-300 bg-teal-50/60 hover:bg-teal-100 text-teal-900 font-semibold text-xs cursor-pointer transition shadow-2xs">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleAddPhotos(e.target.files)}
                  disabled={isCompressing}
                  className="hidden"
                />
                <span>📸</span>
                <span>Snap Another Page</span>
              </label>

              <label className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer transition shadow-2xs">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddPhotos(e.target.files)}
                  disabled={isCompressing}
                  className="hidden"
                />
                <span>🖼️</span>
                <span>Add from Gallery / Files</span>
              </label>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              💡 You can attach both OPD card (for demographics) and Prescription slip (for medicines). Antigravity AI will extract all details together.
            </p>
          </div>
        )}

        {captureMode === 'voice' && (
          <div className="space-y-3">
            {speechSupported ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex-1 rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition ${
                      isRecording
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isRecording ? '⏹' : '🎙️'}</span>
                    <span>{isRecording ? 'Stop Dictation' : transcript ? 'Resume Dictating' : 'Start Dictation'}</span>
                  </button>

                  {isRecording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                      title="Pause microphone so you can edit quietly"
                    >
                      <span>⏸️</span>
                      <span>Pause & Edit</span>
                    </button>
                  )}
                </div>

                {/* Live speech feedback pill */}
                {isRecording && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-teal-900 animate-fadeIn">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    <span className="font-semibold">Live Hearing:</span>
                    <span className="italic truncate text-teal-800">
                      {interimSpeech ? `"${interimSpeech}"` : 'Listening… speak naturally into microphone'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Voice recognition isn&apos;t supported in this browser — you can type or paste your clinical notes below.
              </div>
            )}

            {/* Quick punctuation and section formatting toolbar */}
            <div className="flex items-center justify-between gap-1 flex-wrap pt-1">
              <div className="flex items-center gap-1 flex-wrap text-[11px]">
                <span className="text-slate-400 mr-1 font-medium">Quick Insert:</span>
                <button
                  type="button"
                  onClick={() => appendPunctuation('.')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono border border-slate-200"
                >
                  . (Full Stop)
                </button>
                <button
                  type="button"
                  onClick={() => appendPunctuation(',')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono border border-slate-200"
                >
                  , (Comma)
                </button>
                <button
                  type="button"
                  onClick={() => appendPunctuation('\n')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono border border-slate-200"
                >
                  ↵ (New Line)
                </button>
                <button
                  type="button"
                  onClick={() => appendPhrase('Chief Complaint:')}
                  className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-medium"
                >
                  + CC:
                </button>
                <button
                  type="button"
                  onClick={() => appendPhrase('Examination:')}
                  className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-medium"
                >
                  + Exam:
                </button>
                <button
                  type="button"
                  onClick={() => appendPhrase('Plan / Rx:')}
                  className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-medium"
                >
                  + Plan:
                </button>
              </div>

              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear dictation text?')) {
                      setTranscript('');
                      setInterimSpeech('');
                    }
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition"
                >
                  🗑️ Clear
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Dictate or type clinical notes here... You can freely edit and correct text at any time."
                rows={7}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              💡 <strong>Edit on the go</strong>: You can click inside the box to fix typos or rephrase words manually. New speech will append cleanly without overwriting your manual edits.
            </p>
          </div>
        )}

        {captureMode && (
          <div className="mt-4 space-y-2">
            <button
              disabled={!canExtract || isExtracting}
              onClick={runExtraction}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium shadow-sm transition"
            >
              {isExtracting
                ? (captureMode === 'photo'
                    ? `Extracting with Antigravity AI (Gemini Flash)… analyzing ${photos.length} photo${photos.length > 1 ? 's' : ''}…`
                    : 'Extracting with Antigravity AI (Gemini Flash)…')
                : (captureMode === 'photo'
                    ? `⚡ Extract with Antigravity AI (${photos.length} Photo${photos.length > 1 ? 's' : ''})`
                    : '⚡ Extract with Antigravity AI')}
            </button>
          </div>
        )}
      </div>
    );
  }

  const isFollowup = fields.encounterType === 'followup';
  const isProcedure = fields.encounterType === 'procedure';
  const isNew = fields.encounterType === 'new';

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
      <button onClick={() => setStep('capture')} className="text-xs text-slate-400 hover:text-slate-600">
        ← Change Capture Mode
      </button>

      <div className="flex items-center justify-between mt-2 mb-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {isFollowup ? 'Follow-up Entry' : isProcedure ? 'Procedure Entry' : 'Initial Assessment Entry'}
          </h2>
          <p className="text-xs text-slate-400">
            {patientName} · <span className="font-mono">{patientCode}</span>
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium uppercase tracking-wide">
          {fields.encounterType}
        </span>
      </div>

      {extractError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
          {extractError}
        </div>
      )}

      {/* ── Baseline / Background Context Card for Follow-up & Procedure ── */}
      {priorEncounter && (isFollowup || isProcedure) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Recorded on Intake / Baseline
            </span>
            <button
              type="button"
              onClick={() => setShowEditBaseline(!showEditBaseline)}
              className="text-[11px] text-teal-700 hover:text-teal-900 font-medium"
            >
              {showEditBaseline ? 'Hide edit fields' : 'Edit baseline diagnosis / location ✎'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Diagnosis:</span>
              <strong className="font-medium text-slate-900">{fields.diagnosis || priorEncounter.diagnosis || '—'}</strong>
              {fields.diagnosisCode && (
                <span className="ml-1 font-mono text-[10px] text-teal-700 bg-teal-50 px-1 py-0.5 rounded border border-teal-200">
                  {fields.diagnosisCode}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Pain Location:</span>
              <span className="capitalize">{fields.painLocation || priorEncounter.pain_location || '—'}</span>
            </div>
            {priorEncounter.pain_score_nrs != null && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Baseline Pain:</span>
                <span className="font-semibold text-slate-900">{priorEncounter.pain_score_nrs} / 10</span>
              </div>
            )}
          </div>
        </div>
      )}

      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="source" value={captureMode || 'manual'} />
        <input type="hidden" name="transcript" value={captureMode === 'voice' ? transcript : ''} />
        <input type="hidden" name="ai_confidence" value={JSON.stringify(confidences)} />
        <input type="hidden" name="ai_chief_complaint" value={fields.chiefComplaint} />
        <input type="hidden" name="ai_diagnosis" value={fields.diagnosis} />
        <input type="hidden" name="ai_pain_location" value={fields.painLocation} />
        <input type="hidden" name="ai_pain_score_nrs" value={fields.painScoreNrs} />
        <input type="hidden" name="ai_procedure" value={fields.procedure} />
        <input type="hidden" name="ai_plan" value={fields.plan} />

        {/* Preserve carried-forward values in submission */}
        {(!showEditBaseline && (isFollowup || isProcedure)) && (
          <>
            <input type="hidden" name="chief_complaint" value={fields.chiefComplaint} />
            <input type="hidden" name="diagnosis" value={fields.diagnosis} />
            <input type="hidden" name="diagnosis_code" value={fields.diagnosisCode} />
            <input type="hidden" name="pain_location" value={fields.painLocation} />
          </>
        )}

        {captureMode === 'photo' && photos.length > 0 && (
          <HiddenFileInputs files={photos.map((p) => p.file)} />
        )}

        {/* ── Retrospective Demographic Update Card from OPD Card Scan ── */}
        {extractedDemographics && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200 rounded-xl p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-950">
                <span>📋</span>
                <span>OPD Card Demographics Detected by AI</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyDemographics}
                  onChange={(e) => setApplyDemographics(e.target.checked)}
                  className="rounded border-amber-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Update Patient Chart Retrospectively</span>
              </label>
            </div>

            <p className="text-[11px] text-amber-800">
              Hospital registration details were found on the uploaded OPD card image. Verify or edit them below to backfill the patient&apos;s chart profile:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-xs">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">CR / Reg No.</span>
                <input
                  value={demoCrNo}
                  onChange={(e) => setDemoCrNo(e.target.value)}
                  placeholder="e.g. CR-12345"
                  className="w-full font-mono font-bold text-slate-900 text-xs focus:outline-none"
                />
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-xs">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Name</span>
                <input
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  placeholder="Patient Name"
                  className="w-full font-bold text-slate-900 text-xs focus:outline-none"
                />
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-xs">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Age / Sex</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={demoAge}
                    onChange={(e) => setDemoAge(e.target.value)}
                    placeholder="Age"
                    className="w-12 font-bold text-slate-900 text-xs focus:outline-none"
                  />
                  <span className="text-slate-400">/</span>
                  <select
                    value={demoSex}
                    onChange={(e) => setDemoSex(e.target.value)}
                    className="font-bold text-slate-900 text-xs focus:outline-none bg-transparent"
                  >
                    <option value="">—</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-xs">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Phone</span>
                <input
                  value={demoPhone}
                  onChange={(e) => setDemoPhone(e.target.value)}
                  placeholder="Phone No."
                  className="w-full font-medium text-slate-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-amber-800 font-medium">
                {demographicsSavedNotice || (applyDemographics ? '✓ Will backfill patient master record on saving encounter' : 'Demographic sync unchecked')}
              </span>
              <button
                type="button"
                onClick={handleInstantDemographicsUpdate}
                className="px-2.5 py-1 rounded bg-amber-800 hover:bg-amber-900 text-white font-medium text-[11px] transition shadow-xs"
              >
                ⚡ Update Chart Now
              </button>
            </div>

            <input type="hidden" name="update_patient_demographics" value={applyDemographics ? 'yes' : 'no'} />
            <input type="hidden" name="demographics_cr_no" value={demoCrNo} />
            <input type="hidden" name="demographics_name" value={demoName} />
            <input type="hidden" name="demographics_age" value={demoAge} />
            <input type="hidden" name="demographics_sex" value={demoSex} />
            <input type="hidden" name="demographics_phone" value={demoPhone} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Date</label>
            <input
              name="encounter_date" type="date" value={encounterDate}
              onChange={(e) => setEncounterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Encounter type</label>
            <select
              name="encounter_type" value={fields.encounterType}
              onChange={(e) => set('encounterType', e.target.value as EncounterType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="followup">Follow-up</option>
              <option value="procedure">Procedure</option>
              <option value="new">New Assessment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Editable baseline fields if New Encounter OR clinician explicitly toggles "Edit baseline" */}
        {(isNew || showEditBaseline) && (
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {isNew ? 'Chief Complaint & Diagnosis' : 'Edit Baseline Information'}
            </div>
            <VerifiedField label="Chief complaint" name="chief_complaint" value={fields.chiefComplaint} confidence={confidences.chief_complaint}
              onChange={(v) => set('chiefComplaint', v)} />
            <VerifiedField label="Diagnosis" name="diagnosis" value={fields.diagnosis} confidence={confidences.diagnosis}
              onChange={(v) => set('diagnosis', v)} />
            <DiagnosisCodeInput
              value={fields.diagnosisCode}
              onChange={(v) => set('diagnosisCode', v)}
              onSelect={(code) => {
                if (!fields.diagnosis || fields.diagnosis.trim() === '') {
                  set('diagnosis', code.label);
                }
              }}
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Pain location
                  {activeRule && (
                    <span className="ml-1.5 font-semibold text-[11px] text-teal-700 normal-case">
                      (directed for {activeRule.name})
                    </span>
                  )}
                </label>
                {activeRule && (
                  <button
                    type="button"
                    onClick={() => setShowAllLocations((v) => !v)}
                    className="text-[11px] text-slate-500 hover:text-teal-700 underline transition cursor-pointer"
                  >
                    {showAllLocations ? 'Show directed options only' : 'Show all body locations'}
                  </button>
                )}
              </div>
              <select
                name="pain_location"
                value={fields.painLocation}
                onChange={(e) => set('painLocation', e.target.value as PainLocation)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">— Select pain location —</option>
                {displayedLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {activeRule?.locationLabels[loc] || loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Directed Clinical History Checklist based on Diagnosis Code */}
            {activeRule && (
              <div className="pt-2">
                <DirectedHistorySection
                  rule={activeRule}
                  answers={directedHistoryAnswers}
                  onAnswerChange={(qid, ans) => {
                    setDirectedHistoryAnswers((prev) => ({ ...prev, [qid]: ans }));
                  }}
                  onAutoSyncSummary={(histSummary, redFlagsSummary) => {
                    if (redFlagsSummary) {
                      set('redFlags', redFlagsSummary);
                    }
                    if (histSummary && (!fields.notes || fields.notes.trim() === '')) {
                      set('notes', histSummary);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Past Medical & Surgical History + Past Treatments */}
        {(isNew || showEditBaseline) ? (
          <FieldSet title="Past Medical & Treatment History">
            {/* Past Medical / Surgical History */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Past Medical & Surgical History / Comorbidities
                </label>
                <span className="text-[11px] text-slate-500">Tap to add</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {COMMON_COMORBIDITIES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const cur = fields.pastHistory ? fields.pastHistory.trim() : '';
                      if (!cur.toLowerCase().includes(chip.toLowerCase())) {
                        set('pastHistory', cur ? `${cur}, ${chip}` : chip);
                      }
                    }}
                    className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-800 hover:text-teal-900 transition font-medium cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <textarea
                name="past_history"
                rows={2}
                value={fields.pastHistory}
                onChange={(e) => set('pastHistory', e.target.value)}
                placeholder="e.g. HTN on Telmisartan, T2DM on Metformin; L4-L5 discectomy in 2021; No known drug allergies"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Past Treatments & Interventions Tried */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Past Treatments & Interventions Tried
                </label>
                <span className="text-[11px] text-slate-500">Tap to add</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {COMMON_PAST_TREATMENTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const cur = fields.pastTreatments ? fields.pastTreatments.trim() : '';
                      if (!cur.toLowerCase().includes(chip.toLowerCase())) {
                        set('pastTreatments', cur ? `${cur}, ${chip}` : chip);
                      }
                    }}
                    className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-800 hover:text-teal-900 transition font-medium cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <textarea
                name="past_treatments"
                rows={2}
                value={fields.pastTreatments}
                onChange={(e) => set('pastTreatments', e.target.value)}
                placeholder="e.g. Tried Aceclofenac with mild relief (gastritis); Pregabalin 75mg gave dizziness; Physio 3 weeks; Lumbar epidural injection 6 months back (50% relief for 2 months)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </FieldSet>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowEditBaseline(true)}
              className="text-xs text-slate-500 hover:text-teal-700 underline transition cursor-pointer"
            >
              + View / Update Past History & Treatments
            </button>
          </div>
        )}

        {/* ── CASE 1: FOLLOW-UP ENTRY (RECORD ONLY FOLLOW-UP DATA) ── */}
        {isFollowup && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Current Pain score (NRS 0–10)
                </label>
                {priorEncounter?.pain_score_nrs != null && (
                  <span className="text-[11px] text-slate-400">
                    Baseline was <strong className="text-slate-700">{priorEncounter.pain_score_nrs}/10</strong>
                  </span>
                )}
              </div>
              <select
                name="pain_score_nrs"
                required
                value={fields.painScoreNrs}
                onChange={(e) => set('painScoreNrs', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
              >
                <option value="">— Select Pain Score (NRS 0–10) —</option>
                {PAIN_SCORE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <FieldSet title="Follow-up Outcome (Since Last Visit)">
              <SelectField
                label="Patient Global Impression of Change (PGIC)"
                name="patient_global_impression"
                value={fields.patientGlobalImpression}
                onChange={(v) => set('patientGlobalImpression', v as Fields['patientGlobalImpression'])}
                options={PATIENT_GLOBAL_IMPRESSIONS}
              />
              <SelectField
                label="Functional Change"
                name="functional_change"
                value={fields.functionalChange}
                onChange={(v) => set('functionalChange', v as Fields['functionalChange'])}
                options={FUNCTIONAL_CHANGES}
              />
              <TriField
                label="Re-intervention needed?"
                name="reintervention_needed"
                value={fields.reinterventionNeeded}
                onChange={(v) => set('reinterventionNeeded', v)}
              />
              <TextField
                label="Adverse events / complications"
                name="adverse_event"
                value={fields.adverseEvent}
                onChange={(v) => set('adverseEvent', v)}
                placeholder="e.g. none"
              />
            </FieldSet>

            <FieldSet title="Outcomes & Functional Impact (0–10 Scale)">
              <div className="space-y-2.5">
                <ScoreSelector
                  label="Function"
                  subtitle="Physical mobility & daily activity"
                  name="function_score_0_10"
                  value={fields.functionScore}
                  onChange={(v) => set('functionScore', v)}
                  anchorLow="Normal activity"
                  anchorHigh="Disabled / Bedbound"
                />
                <ScoreSelector
                  label="Mood"
                  subtitle="Anxiety, depression & distress"
                  name="mood_score_0_10"
                  value={fields.moodScore}
                  onChange={(v) => set('moodScore', v)}
                  anchorLow="Calm / Happy"
                  anchorHigh="Severe distress"
                />
                <ScoreSelector
                  label="Sleep"
                  subtitle="Nighttime pain awakenings & insomnia"
                  name="sleep_score_0_10"
                  value={fields.sleepScore}
                  onChange={(v) => set('sleepScore', v)}
                  anchorLow="Peaceful sleep"
                  anchorHigh="Severe insomnia"
                />
                <ScoreSelector
                  label="Quality of Life (QoL)"
                  subtitle="Overall vitality & wellbeing"
                  name="qol_score_0_10"
                  value={fields.qolScore}
                  onChange={(v) => set('qolScore', v)}
                  anchorLow="Excellent"
                  anchorHigh="Poorest QoL"
                />
              </div>
            </FieldSet>

            <PainRegimensBar
              currentPlan={fields.plan}
              onAppendPlan={(text) => set('plan', fields.plan ? `${fields.plan}\n${text}` : text)}
              onAppendNotes={handleAddAdviceToNotes}
            />

            <VerifiedField
              label="Treatment Plan / Medication Updates"
              name="plan"
              value={fields.plan}
              confidence={confidences.plan}
              onChange={(v) => set('plan', v)}
              textarea
            />
            <NonInvasiveRxBuilder
              currentPlan={fields.plan}
              onAppendPlan={(text) => set('plan', fields.plan ? `${fields.plan}\n${text}` : text)}
              onAppendAdvice={handleAddAdviceToNotes}
            />
            <ManagementProtocolsSection
              diagnosisCode={fields.diagnosisCode || priorEncounter?.diagnosis_code || ''}
              diagnosisText={fields.diagnosis || priorEncounter?.diagnosis || ''}
              painLocation={fields.painLocation || priorEncounter?.pain_location || ''}
              isProcedure={false}
              currentNotes={fields.notes}
              onAddAdvice={handleAddAdviceToNotes}
              onReplaceAdvice={handleReplaceNotes}
            />
            <SmartPhrasesPicker
              onInsert={(text) => {
                set('notes', fields.notes ? `${fields.notes}\n\n${text}` : text);
              }}
            />
            <TextField
              label="Notes / Instructions & Advice (Printed on Rx)"
              name="notes"
              value={fields.notes}
              onChange={(v) => set('notes', v)}
              textarea
            />
          </>
        )}

        {/* ── CASE 2: PROCEDURE ENTRY (RECORD ONLY PROCEDURE DATA) ── */}
        {isProcedure && (
          <>
            <FieldSet title="Procedure Details">
              <VerifiedField
                label="Procedure Name"
                name="procedure"
                value={fields.procedure}
                confidence={confidences.procedure}
                onChange={(v) => set('procedure', v)}
              />
              <SelectField
                label="Procedure Category"
                name="procedure_category"
                value={fields.procedureCategory}
                onChange={(v) => {
                  const cat = v as Fields['procedureCategory'];
                  set('procedureCategory', cat);
                  if (cat === 'diagnostic_block') set('procedureIntent', 'diagnostic');
                  else if (cat === 'therapeutic_block' || cat === 'neuromodulation') set('procedureIntent', 'therapeutic');
                  else if (cat === 'neurolytic_procedure') set('procedureIntent', 'neurolytic');
                  else if (cat === 'other') set('procedureIntent', 'therapeutic');
                  else set('procedureIntent', '');
                }}
                options={PROCEDURE_CATEGORIES}
              />
              <input type="hidden" name="procedure_intent" value={fields.procedureIntent} />
              <TextField
                label="Level(s) / Laterality"
                name="procedure_level_laterality"
                value={fields.procedureLevelLaterality}
                onChange={(v) => set('procedureLevelLaterality', v)}
                placeholder="e.g. L4-L5 right, Bilateral L3-L5"
              />
              <SelectField
                label="Guidance Used"
                name="procedure_guidance"
                value={fields.procedureGuidance}
                onChange={(v) => set('procedureGuidance', v as Fields['procedureGuidance'])}
                options={PROCEDURE_GUIDANCES}
              />
              <TextField
                label="Drugs Used"
                name="drugs_used"
                value={fields.drugsUsed}
                onChange={(v) => set('drugsUsed', v)}
                placeholder="e.g. Ropivacaine 0.2% 2ml + Dexamethasone 4mg"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Immediate Pain Relief (NRS 0–10)
                  </label>
                  <select
                    name="immediate_pain_relief_nrs"
                    value={fields.immediatePainReliefNrs}
                    onChange={(e) => set('immediatePainReliefNrs', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
                  >
                    <option value="">— Select (NRS 0–10) —</option>
                    {PAIN_SCORE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField
                  label="Immediate Complications"
                  name="immediate_complications"
                  value={fields.immediateComplications}
                  onChange={(v) => set('immediateComplications', v)}
                  placeholder="e.g. none"
                />
              </div>

              {/* OneDrive Cloud Media / Video Link */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  <span>🎥</span>
                  <span>Attach Procedural Media / Video (OneDrive Link)</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Paste a OneDrive direct link to automatically attach C-arm fluoroscopy clips, ultrasound video, or post-procedure photos to this patient’s chart.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Media Type
                    </label>
                    <select
                      name="procedure_media_type"
                      value={fields.procedureMediaType}
                      onChange={(e) => set('procedureMediaType', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="procedure_video">🎥 Procedure Video</option>
                      <option value="procedure_photo">📸 Procedure Photo</option>
                      <option value="ultrasound">📱 Ultrasound Image/Clip</option>
                      <option value="xray">🩻 Fluoroscopy / X-Ray</option>
                      <option value="other">📁 Other File</option>
                    </select>
                  </div>
                  <TextField
                    label="Media Title"
                    name="procedure_media_title"
                    value={fields.procedureMediaTitle}
                    onChange={(v) => set('procedureMediaTitle', v)}
                    placeholder="e.g. C-Arm Fluoroscopy Needle Placement"
                  />
                </div>
                <TextField
                  label="OneDrive Share URL / Link"
                  name="procedure_media_url"
                  value={fields.procedureMediaUrl}
                  onChange={(v) => set('procedureMediaUrl', v)}
                  placeholder="https://1drv.ms/... or https://...my.sharepoint.com/..."
                />
              </div>
            </FieldSet>

            <VerifiedField
              label="Post-Procedure Plan / Instructions"
              name="plan"
              value={fields.plan}
              confidence={confidences.plan}
              onChange={(v) => set('plan', v)}
              textarea
            />
            <NonInvasiveRxBuilder
              currentPlan={fields.plan}
              onAppendPlan={(text) => set('plan', fields.plan ? `${fields.plan}\n${text}` : text)}
              onAppendAdvice={handleAddAdviceToNotes}
            />
            <ManagementProtocolsSection
              diagnosisCode={fields.diagnosisCode || priorEncounter?.diagnosis_code || ''}
              diagnosisText={fields.diagnosis || priorEncounter?.diagnosis || fields.procedure || ''}
              painLocation={fields.painLocation || priorEncounter?.pain_location || ''}
              isProcedure={true}
              currentNotes={fields.notes}
              onAddAdvice={handleAddAdviceToNotes}
              onReplaceAdvice={handleReplaceNotes}
            />
            <SmartPhrasesPicker
              onInsert={(text) => {
                set('notes', fields.notes ? `${fields.notes}\n\n${text}` : text);
              }}
            />
            <TextField
              label="Procedural Notes & Post-Op Advice (Printed on Rx)"
              name="notes"
              value={fields.notes}
              onChange={(v) => set('notes', v)}
              textarea
            />
          </>
        )}

        {/* ── CASE 3: NEW ASSESSMENT ENTRY (FULL INTAKE) ── */}
        {isNew && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Pain score (NRS 0–10)
                </label>
                {confidences.pain_score_nrs && (
                  <ConfidenceBadge confidence={confidences.pain_score_nrs} />
                )}
              </div>
              <select
                name="pain_score_nrs"
                required
                value={fields.painScoreNrs}
                onChange={(e) => set('painScoreNrs', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
              >
                <option value="">— Select Pain Score (NRS 0–10) —</option>
                {PAIN_SCORE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <CdssPrompts context={{
              chiefComplaint: fields.chiefComplaint,
              diagnosis: fields.diagnosis,
              painLocation: fields.painLocation,
              painMechanism: fields.painMechanism,
              encounterType: fields.encounterType,
              transcript: captureMode === 'voice' ? transcript : '',
              filledFields: (Object.entries(fields) as [string, string][])
                .filter(([, v]) => v !== '' && v != null)
                .map(([k]) => k),
            }} />

            <FieldSet title="Assessment">
              <SelectField label="Pain mechanism" name="pain_mechanism" value={fields.painMechanism}
                onChange={(v) => set('painMechanism', v as Fields['painMechanism'])} options={PAIN_MECHANISMS} />
              <SelectField label="Diagnosis confidence" name="diagnosis_confidence" value={fields.diagnosisConfidence}
                onChange={(v) => set('diagnosisConfidence', v as Fields['diagnosisConfidence'])} options={['high', 'medium', 'low']} />
              <SelectField label="Imaging–symptom concordance" name="imaging_concordance" value={fields.imagingConcordance}
                onChange={(v) => set('imagingConcordance', v as Fields['imagingConcordance'])} options={IMAGING_CONCORDANCES} />
              <TextField label="Red flags" name="red_flags" value={fields.redFlags}
                onChange={(v) => set('redFlags', v)} placeholder="e.g. none, or progressive neuro deficit" />

              {/* Cancer pain: auto-detected from initial diagnosis */}
              {showCancerSection ? (
                <div className="pt-2 border-t border-teal-100 bg-teal-50/50 -mx-3 px-3 py-3 rounded-b-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-900">
                      <span>🎗️</span>
                      <span>Cancer Pain Patient</span>
                      {isCancerDetected && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-medium">
                          Auto-detected from diagnosis
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDismissCancerPrompt(true);
                        setManualShowCancer(false);
                        set('isCancerPain', 'no');
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-600 underline transition"
                    >
                      Clear / Non-cancer
                    </button>
                  </div>
                  <input type="hidden" name="is_cancer_pain" value={fields.isCancerPain || 'yes'} />
                  <TextField label="Cancer type / primary site" name="cancer_type" value={fields.cancerType}
                    onChange={(v) => set('cancerType', v)} placeholder="e.g. Ca Breast, Lung, Multiple Myeloma" />
                  <TriField label="Metastatic disease" name="metastatic_disease" value={fields.metastaticDisease}
                    onChange={(v) => set('metastaticDisease', v)} />
                  <TextField label="Current oncologic treatment" name="oncologic_treatment" value={fields.oncologicTreatment}
                    onChange={(v) => set('oncologicTreatment', v)} placeholder="e.g. Chemotherapy, Radiotherapy, Hormone therapy, Palliative" />
                  <SelectField label="Goal of care" name="goal_of_care" value={fields.goalOfCare}
                    onChange={(v) => set('goalOfCare', v as Fields['goalOfCare'])} options={GOALS_OF_CARE} />
                </div>
              ) : (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setManualShowCancer(true);
                      setDismissCancerPrompt(false);
                      set('isCancerPain', 'yes');
                    }}
                    className="text-[11px] text-slate-400 hover:text-teal-700 transition"
                  >
                    + Add oncologic / cancer pain details
                  </button>
                </div>
              )}
            </FieldSet>

            <FieldSet title="Baseline Outcomes & Functional Impact">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Functional Impact (Clinical Grade)
                </label>
                <select
                  name="functional_impact"
                  value={fields.functionalImpact}
                  onChange={(e) => {
                    const val = e.target.value;
                    set('functionalImpact', val);
                    const matchedOpt = FUNCTIONAL_IMPACT_OPTIONS.find((o) => o.value === val);
                    if (matchedOpt && (!fields.functionScore || fields.functionScore === '')) {
                      set('functionScore', matchedOpt.score);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">— Select Functional Impact Grade —</option>
                  {FUNCTIONAL_IMPACT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Selecting a clinical grade automatically aligns the baseline Function score below.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Baseline Outcome Scores (0–10 Scale, Tap to score)
                </div>
                <ScoreSelector
                  label="Function"
                  subtitle="Physical mobility & daily activity"
                  name="function_score_0_10"
                  value={fields.functionScore}
                  onChange={(v) => set('functionScore', v)}
                  anchorLow="Normal mobility"
                  anchorHigh="Severe disability"
                />
                <ScoreSelector
                  label="Mood"
                  subtitle="Anxiety, depression & distress"
                  name="mood_score_0_10"
                  value={fields.moodScore}
                  onChange={(v) => set('moodScore', v)}
                  anchorLow="Calm / Happy"
                  anchorHigh="Severe distress"
                />
                <ScoreSelector
                  label="Sleep"
                  subtitle="Nighttime pain awakenings & insomnia"
                  name="sleep_score_0_10"
                  value={fields.sleepScore}
                  onChange={(v) => set('sleepScore', v)}
                  anchorLow="Peaceful sleep"
                  anchorHigh="Severe insomnia"
                />
                <ScoreSelector
                  label="Quality of Life (QoL)"
                  subtitle="Overall vitality & life enjoyment"
                  name="qol_score_0_10"
                  value={fields.qolScore}
                  onChange={(v) => set('qolScore', v)}
                  anchorLow="Excellent"
                  anchorHigh="Poorest QoL"
                />
              </div>

              {showWidespreadSection ? (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-teal-700 font-medium">
                      Screening active for {activeRule?.name || 'generalized/arthritic condition'}
                    </span>
                  </div>
                  <TriField
                    label="Widespread Body Pain (Multi-quadrant / axial & peripheral)?"
                    name="widespread_pain"
                    value={fields.widespreadPain}
                    onChange={(v) => set('widespreadPain', v)}
                  />
                </div>
              ) : (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setManualShowWidespread(true);
                      set('widespreadPain', 'yes');
                    }}
                    className="text-[11px] text-slate-500 hover:text-teal-700 transition cursor-pointer"
                  >
                    + Check for widespread pain
                  </button>
                </div>
              )}
            </FieldSet>

            <PainRegimensBar
              currentPlan={fields.plan}
              onAppendPlan={(text) => set('plan', fields.plan ? `${fields.plan}\n${text}` : text)}
              onAppendNotes={handleAddAdviceToNotes}
            />

            <VerifiedField label="Treatment Plan / Pharmacological Rx" name="plan" value={fields.plan} confidence={confidences.plan}
              onChange={(v) => set('plan', v)} textarea />
            <NonInvasiveRxBuilder
              currentPlan={fields.plan}
              onAppendPlan={(text) => set('plan', fields.plan ? `${fields.plan}\n${text}` : text)}
              onAppendAdvice={handleAddAdviceToNotes}
            />
            <ManagementProtocolsSection
              diagnosisCode={fields.diagnosisCode}
              diagnosisText={fields.diagnosis}
              painLocation={fields.painLocation}
              isProcedure={false}
              currentNotes={fields.notes}
              onAddAdvice={handleAddAdviceToNotes}
              onReplaceAdvice={handleReplaceNotes}
            />
            <SmartPhrasesPicker
              onInsert={(text) => {
                set('notes', fields.notes ? `${fields.notes}\n\n${text}` : text);
              }}
            />
            <TextField label="Clinical Notes & Advice (Printed on Rx)" name="notes" value={fields.notes} onChange={(v) => set('notes', v)} textarea />
          </>
        )}

        {/* ── Schedule Next Visit (Available on all visit types) ── */}
        <FieldSet title="Schedule next visit (optional)">
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Type" name="schedule_type" value={scheduleType}
              onChange={(v) => setScheduleType(v as '' | 'followup' | 'procedure')} options={['followup', 'procedure']} />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Date</label>
              <input
                name="schedule_date" type="date" value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Time</label>
              <input
                name="schedule_time" type="time" value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <TextField label="Location" name="schedule_location" value={scheduleLocation}
              onChange={setScheduleLocation} placeholder="e.g. OPD-1, OT-2" />
          </div>
        </FieldSet>

        <button
          type="submit"
          className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-3 text-sm font-medium shadow-sm transition"
        >
          {isFollowup ? 'Save Follow-up to Record' : isProcedure ? 'Save Procedure to Record' : 'Save Patient Intake'}
        </button>
      </form>
    </div>
  );
}

function HiddenFileInputs({ files }: { files: File[] }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current && files.length > 0) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      ref.current.files = dt.files;
    }
  }, [files]);
  return <input ref={ref} type="file" name="attachment" multiple className="hidden" readOnly />;
}

function VerifiedField({
  label, name, value, confidence, hint, onChange, type = 'text', textarea = false,
}: {
  label: string; name: string; value: string; confidence?: string; hint?: React.ReactNode;
  onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{label}</label>
        {confidence ? <ConfidenceBadge confidence={confidence} /> : hint}
      </div>
      {textarea ? (
        <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      ) : (
        <input name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${CONF_STYLES[confidence] || CONF_STYLES.low}`}>
      {confidence}
    </span>
  );
}

function FieldSet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white shadow-2xs">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</div>
      {children}
    </div>
  );
}

function TextField({
  label, name, value, onChange, placeholder, type = 'text', textarea = false,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      ) : (
        <input name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      )}
    </div>
  );
}

function SelectField({
  label, name, value, onChange, options,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void; options: readonly string[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">{label}</label>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
        <option value="">—</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  );
}

function TriField({
  label, name, value, onChange,
}: {
  label: string; name: string; value: '' | 'yes' | 'no'; onChange: (v: '' | 'yes' | 'no') => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">{label}</label>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value as '' | 'yes' | 'no')}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}
