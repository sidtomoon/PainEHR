'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { CdssPrompts } from './CdssPrompts';
import { DiagnosisCodeInput } from './DiagnosisCodeInput';
import { DirectedHistorySection } from './DirectedHistorySection';
import { matchClinicalRule } from '@/lib/clinical-decision-rules';
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
  painMechanism: '', functionalImpact: '', redFlags: '', diagnosisConfidence: '',
  imagingConcordance: '', isCancerPain: '', cancerType: '', metastaticDisease: '',
  oncologicTreatment: '', goalOfCare: '',
  procedureCategory: '', procedureLevelLaterality: '', procedureGuidance: '',
  drugsUsed: '', procedureIntent: '', immediatePainReliefNrs: '', immediateComplications: '',
  plannedFollowupInterval: '',
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

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [transcript, setTranscript] = useState('');
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

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  const activeRule = matchClinicalRule(fields.diagnosisCode, fields.diagnosis);

  // Auto-align location when a diagnosis matches a clinical rule
  useEffect(() => {
    if (activeRule && (!fields.painLocation || !activeRule.directedLocations.includes(fields.painLocation as PainLocation))) {
      set('painLocation', activeRule.defaultLocation);
    }
  }, [activeRule?.id]);

  const displayedLocations = activeRule && !showAllLocations
    ? activeRule.directedLocations
    : PAIN_LOCATIONS;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleRecording() {
    type SpeechRecognitionLike = {
      continuous: boolean; interimResults: boolean; lang: string;
      onresult: ((e: unknown) => void) | null; onerror: (() => void) | null; onend: (() => void) | null;
      start: () => void; stop: () => void;
    };
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    let finalTranscript = transcript ? transcript + ' ' : '';
    recognition.onresult = (event) => {
      const e = event as { resultIndex: number; results: { isFinal: boolean; [i: number]: { transcript: string } }[] };
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += chunk + ' ';
        else interim += chunk;
      }
      setTranscript((finalTranscript + interim).trim());
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  async function runExtraction() {
    setIsExtracting(true);
    setExtractError(null);
    try {
      let body: Record<string, unknown>;
      if (captureMode === 'photo' && photoFile && photoPreview) {
        const base64 = photoPreview.split(',')[1];
        body = { mode: 'photo', imageBase64: base64, mediaType: photoFile.type };
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

  const canExtract = (captureMode === 'photo' && !!photoPreview) || (captureMode === 'voice' && transcript.trim().length > 0);

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

        {captureMode === 'photo' && (
          <label className="block border-2 border-dashed border-slate-200 rounded-lg py-8 text-center cursor-pointer hover:border-teal-300 transition">
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
            {photoPreview ? (
              <img src={photoPreview} alt="capture preview" className="max-h-64 mx-auto rounded shadow-sm" />
            ) : (
              <div className="text-slate-400 text-sm">Tap to take or choose a photo</div>
            )}
          </label>
        )}

        {captureMode === 'voice' && (
          <div className="space-y-3">
            {speechSupported ? (
              <button
                onClick={toggleRecording}
                className={`w-full rounded-lg py-3 text-sm font-medium ${isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-white'}`}
              >
                {isRecording ? '⏹ Stop recording' : '🎙️ Start recording'}
              </button>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Voice recognition isn&apos;t supported in this browser — type or paste the transcript below.
              </div>
            )}
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Transcript appears here as you speak — or type/paste it directly."
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}

        {captureMode && (
          <div className="mt-4 space-y-2">
            <button
              disabled={!canExtract || isExtracting}
              onClick={runExtraction}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium shadow-sm transition"
            >
              {isExtracting ? 'Extracting with Claude AI…' : 'Extract with AI'}
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

        {captureMode === 'photo' && photoFile && (
          <HiddenFileInput file={photoFile} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Date</label>
            <input
              name="encounter_date" type="date" value={encounterDate}
              onChange={(e) => setEncounterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Encounter type</label>
            <select
              name="encounter_type" value={fields.encounterType}
              onChange={(e) => set('encounterType', e.target.value as EncounterType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Pain location
                  {activeRule && (
                    <span className="ml-1.5 font-normal text-[11px] text-teal-600 normal-case">
                      (directed for {activeRule.name})
                    </span>
                  )}
                </label>
                {activeRule && (
                  <button
                    type="button"
                    onClick={() => setShowAllLocations((v) => !v)}
                    className="text-[11px] text-slate-400 hover:text-teal-700 underline transition"
                  >
                    {showAllLocations ? 'Show directed options only' : 'Show all body locations'}
                  </button>
                )}
              </div>
              <select
                name="pain_location"
                value={fields.painLocation}
                onChange={(e) => set('painLocation', e.target.value as PainLocation)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    if (histSummary && (!fields.functionalImpact || fields.functionalImpact.trim() === '')) {
                      set('functionalImpact', histSummary);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── CASE 1: FOLLOW-UP ENTRY (RECORD ONLY FOLLOW-UP DATA) ── */}
        {isFollowup && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Current Pain score (NRS 0–10)
                </label>
                {priorEncounter?.pain_score_nrs != null && (
                  <span className="text-[11px] text-slate-400">
                    Baseline was <strong className="text-slate-700">{priorEncounter.pain_score_nrs}/10</strong>
                  </span>
                )}
              </div>
              <input
                name="pain_score_nrs"
                type="number"
                min={0}
                max={10}
                required
                value={fields.painScoreNrs}
                onChange={(e) => set('painScoreNrs', e.target.value)}
                placeholder="0 = no pain, 10 = worst imaginable"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
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

            <FieldSet title="Outcomes (0–10, leave blank if not assessed)">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Function" name="function_score_0_10" value={fields.functionScore}
                  onChange={(v) => set('functionScore', v)} type="number" />
                <TextField label="Mood" name="mood_score_0_10" value={fields.moodScore}
                  onChange={(v) => set('moodScore', v)} type="number" />
                <TextField label="Sleep" name="sleep_score_0_10" value={fields.sleepScore}
                  onChange={(v) => set('sleepScore', v)} type="number" />
                <TextField label="Quality of life" name="qol_score_0_10" value={fields.qolScore}
                  onChange={(v) => set('qolScore', v)} type="number" />
              </div>
            </FieldSet>

            <VerifiedField
              label="Treatment Plan / Medication Updates"
              name="plan"
              value={fields.plan}
              confidence={confidences.plan}
              onChange={(v) => set('plan', v)}
              textarea
            />
            <TextField
              label="Notes / Learning Points"
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
                onChange={(v) => set('procedureCategory', v as Fields['procedureCategory'])}
                options={PROCEDURE_CATEGORIES}
              />
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
              <SelectField
                label="Procedure Intent"
                name="procedure_intent"
                value={fields.procedureIntent}
                onChange={(v) => set('procedureIntent', v as Fields['procedureIntent'])}
                options={PROCEDURE_INTENTS}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Immediate Pain Relief (NRS 0–10)"
                  name="immediate_pain_relief_nrs"
                  value={fields.immediatePainReliefNrs}
                  onChange={(v) => set('immediatePainReliefNrs', v)}
                  type="number"
                />
                <TextField
                  label="Immediate Complications"
                  name="immediate_complications"
                  value={fields.immediateComplications}
                  onChange={(v) => set('immediateComplications', v)}
                  placeholder="e.g. none"
                />
              </div>
              <TextField
                label="Planned Follow-up Interval"
                name="planned_followup_interval"
                value={fields.plannedFollowupInterval}
                onChange={(v) => set('plannedFollowupInterval', v)}
                placeholder="e.g. 1 week, 2 weeks"
              />
            </FieldSet>

            <VerifiedField
              label="Post-Procedure Plan / Instructions"
              name="plan"
              value={fields.plan}
              confidence={confidences.plan}
              onChange={(v) => set('plan', v)}
              textarea
            />
            <TextField
              label="Procedural Notes"
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
            <VerifiedField
              label="Pain score (NRS 0–10)"
              name="pain_score_nrs"
              value={fields.painScoreNrs}
              confidence={confidences.pain_score_nrs}
              onChange={(v) => set('painScoreNrs', v)}
              type="number"
            />

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
              <TextField label="Functional impact" name="functional_impact" value={fields.functionalImpact}
                onChange={(v) => set('functionalImpact', v)} placeholder="e.g. ADLs limited, sleep affected" />
              <TextField label="Red flags" name="red_flags" value={fields.redFlags}
                onChange={(v) => set('redFlags', v)} placeholder="e.g. none, or progressive neuro deficit" />
              <SelectField label="Diagnosis confidence" name="diagnosis_confidence" value={fields.diagnosisConfidence}
                onChange={(v) => set('diagnosisConfidence', v as Fields['diagnosisConfidence'])} options={['high', 'medium', 'low']} />
              <SelectField label="Imaging–symptom concordance" name="imaging_concordance" value={fields.imagingConcordance}
                onChange={(v) => set('imagingConcordance', v as Fields['imagingConcordance'])} options={IMAGING_CONCORDANCES} />

              {/* Cancer pain: clearly marked NOT required */}
              <div className="pt-2 border-t border-slate-100">
                <TriField
                  label="Cancer pain patient? (Optional — Yes / No)"
                  name="is_cancer_pain"
                  value={fields.isCancerPain}
                  onChange={(v) => set('isCancerPain', v)}
                />
                {fields.isCancerPain === 'yes' && (
                  <div className="mt-2 pl-3 border-l-2 border-teal-200 space-y-2">
                    <TextField label="Cancer type" name="cancer_type" value={fields.cancerType} onChange={(v) => set('cancerType', v)} />
                    <TriField label="Metastatic disease" name="metastatic_disease" value={fields.metastaticDisease}
                      onChange={(v) => set('metastaticDisease', v)} />
                    <TextField label="Current oncologic treatment" name="oncologic_treatment" value={fields.oncologicTreatment}
                      onChange={(v) => set('oncologicTreatment', v)} />
                    <SelectField label="Goal of care" name="goal_of_care" value={fields.goalOfCare}
                      onChange={(v) => set('goalOfCare', v as Fields['goalOfCare'])} options={GOALS_OF_CARE} />
                  </div>
                )}
              </div>
            </FieldSet>

            <FieldSet title="Baseline Outcomes (0–10, leave blank if not assessed)">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Function" name="function_score_0_10" value={fields.functionScore}
                  onChange={(v) => set('functionScore', v)} type="number" />
                <TextField label="Mood" name="mood_score_0_10" value={fields.moodScore}
                  onChange={(v) => set('moodScore', v)} type="number" />
                <TextField label="Sleep" name="sleep_score_0_10" value={fields.sleepScore}
                  onChange={(v) => set('sleepScore', v)} type="number" />
                <TextField label="Quality of life" name="qol_score_0_10" value={fields.qolScore}
                  onChange={(v) => set('qolScore', v)} type="number" />
              </div>
              <TriField label="Widespread pain?" name="widespread_pain" value={fields.widespreadPain}
                onChange={(v) => set('widespreadPain', v)} />
              <TextField label="Adverse event" name="adverse_event" value={fields.adverseEvent}
                onChange={(v) => set('adverseEvent', v)} placeholder="e.g. none" />
            </FieldSet>

            <VerifiedField label="Treatment Plan" name="plan" value={fields.plan} confidence={confidences.plan}
              onChange={(v) => set('plan', v)} textarea />
            <TextField label="Clinical Notes" name="notes" value={fields.notes} onChange={(v) => set('notes', v)} textarea />
          </>
        )}

        {/* ── Schedule Next Visit (Available on all visit types) ── */}
        <FieldSet title="Schedule next visit (optional)">
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Type" name="schedule_type" value={scheduleType}
              onChange={(v) => setScheduleType(v as '' | 'followup' | 'procedure')} options={['followup', 'procedure']} />
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Date</label>
              <input
                name="schedule_date" type="date" value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Time</label>
              <input
                name="schedule_time" type="time" value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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

function HiddenFileInput({ file }: { file: File }) {
  const ref = useRef<HTMLInputElement>(null);
  const assigned = useRef(false);
  if (ref.current && !assigned.current) {
    const dt = new DataTransfer();
    dt.items.add(file);
    ref.current.files = dt.files;
    assigned.current = true;
  }
  return <input ref={ref} type="file" name="attachment" className="hidden" readOnly />;
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
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
        {confidence ? <ConfidenceBadge confidence={confidence} /> : hint}
      </div>
      {textarea ? (
        <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      ) : (
        <input name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide ${CONF_STYLES[confidence] || CONF_STYLES.low}`}>
      {confidence}
    </span>
  );
}

function FieldSet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</div>
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
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      ) : (
        <input name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
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
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
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
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value as '' | 'yes' | 'no')}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}
