import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Square, User, Plus, ChevronLeft, Check, Clock, AlertTriangle, Search, Loader2, RotateCcw, Stethoscope } from 'lucide-react';

const CONF_STYLES = {
  high: 'bg-teal-50 text-teal-700 border-teal-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-rose-50 text-rose-700 border-rose-200',
};

const EMPTY_FIELDS = {
  encounterType: 'new',
  chiefComplaint: '',
  diagnosis: '',
  painScoreNrs: '',
  procedure: '',
  plan: '',
  notes: '',
};

export default function PainEHR() {
  const [view, setView] = useState('list'); // list | newPatient | patient | capture | review
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [loadingEncounters, setLoadingEncounters] = useState(false);

  const [newPatientForm, setNewPatientForm] = useState({ name: '', age: '', sex: '', phone: '' });
  const [addPatientError, setAddPatientError] = useState(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  const [captureMode, setCaptureMode] = useState(null); // 'photo' | 'voice'
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoMediaType, setPhotoMediaType] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [confidences, setConfidences] = useState({});
  const [editableFields, setEditableFields] = useState(EMPTY_FIELDS);
  const [encounterDate, setEncounterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expandedEncounterId, setExpandedEncounterId] = useState(null);
  const [saveEncounterError, setSaveEncounterError] = useState(null);
  const [isSavingEncounter, setIsSavingEncounter] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('patients-index', false);
        setPatients(res ? JSON.parse(res.value) : []);
      } catch (e) {
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    })();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);
  }, []);

  useEffect(() => {
    if (view === 'patient' && selectedPatientId) {
      loadEncounters(selectedPatientId);
    }
  }, [view, selectedPatientId]);

  async function loadEncounters(patientId) {
    setLoadingEncounters(true);
    try {
      const res = await window.storage.get(`encounters:${patientId}`, false);
      const list = res ? JSON.parse(res.value) : [];
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setEncounters(list);
    } catch (e) {
      setEncounters([]);
    } finally {
      setLoadingEncounters(false);
    }
  }

  async function savePatientsIndex(list) {
    await window.storage.set('patients-index', JSON.stringify(list), false);
    setPatients(list);
  }

  async function handleAddPatient(e) {
    e.preventDefault();
    if (!newPatientForm.name.trim()) return;
    setAddPatientError(null);
    setIsSavingPatient(true);
    const patient = {
      id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newPatientForm.name.trim(),
      age: newPatientForm.age,
      sex: newPatientForm.sex,
      phone: newPatientForm.phone,
      createdAt: new Date().toISOString(),
    };
    const list = [...patients, patient];
    try {
      if (!window.storage) throw new Error('Storage is not available in this preview.');
      await savePatientsIndex(list);
      setNewPatientForm({ name: '', age: '', sex: '', phone: '' });
      setSelectedPatientId(patient.id);
      setEncounters([]);
      setView('patient');
    } catch (err) {
      console.error('Failed to save patient', err);
      setAddPatientError((err && err.message) || 'Could not save this patient. Please try again.');
    } finally {
      setIsSavingPatient(false);
    }
  }

  function openPatient(id) {
    setSelectedPatientId(id);
    setView('patient');
  }

  function startNewEncounter() {
    setCaptureMode(null);
    setPhotoBase64(null);
    setPhotoPreview(null);
    setPhotoMediaType(null);
    setTranscript('');
    setExtractError(null);
    setEditableFields(EMPTY_FIELDS);
    setConfidences({});
    setEncounterDate(new Date().toISOString().slice(0, 10));
    setView('capture');
  }

  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPhotoMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      setPhotoBase64(base64);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function toggleRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isRecording) {
      recognitionRef.current && recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    let finalTranscript = transcript ? transcript + ' ' : '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += chunk + ' ';
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
    const system = `You are a clinical data extraction assistant for a pain medicine physician's personal patient records tool. Extract structured fields from the clinical capture provided (a photo of a prescription/handwritten note, or a dictated transcript). Never invent information. If a field is not stated or is illegible, set it to null and mark its confidence as "low". Respond with ONLY a raw JSON object (no markdown fences, no commentary) in exactly this shape:
{"encounter_type": "new" | "followup" | "procedure" | "other", "chief_complaint": string|null, "diagnosis": string|null, "pain_score_nrs": number|null, "procedure": string|null, "plan": string|null, "notes": string|null, "confidence": {"chief_complaint":"high"|"medium"|"low", "diagnosis":"high"|"medium"|"low", "pain_score_nrs":"high"|"medium"|"low", "procedure":"high"|"medium"|"low", "plan":"high"|"medium"|"low"}}`;

    let content;
    if (captureMode === 'photo' && photoBase64) {
      content = [
        { type: 'image', source: { type: 'base64', media_type: photoMediaType, data: photoBase64 } },
        { type: 'text', text: 'Extract the structured fields from this clinical photo as instructed.' },
      ];
    } else {
      content = [
        { type: 'text', text: `Dictated encounter transcript:\n"""\n${transcript}\n"""\n\nExtract the structured fields as instructed.` },
      ];
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system,
          messages: [{ role: 'user', content }],
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'AI extraction failed');
      const textBlock = (data.content || []).find((b) => b.type === 'text');
      let raw = textBlock ? textBlock.text : '';
      raw = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      setEditableFields({
        encounterType: parsed.encounter_type || 'new',
        chiefComplaint: parsed.chief_complaint || '',
        diagnosis: parsed.diagnosis || '',
        painScoreNrs: parsed.pain_score_nrs ?? '',
        procedure: parsed.procedure || '',
        plan: parsed.plan || '',
        notes: parsed.notes || '',
      });
      setConfidences(parsed.confidence || {});
      setView('review');
    } catch (e) {
      setExtractError(e.message || 'Something went wrong during extraction. You can still fill fields in manually below.');
      setView('review');
    } finally {
      setIsExtracting(false);
    }
  }

  function skipToManualReview() {
    setExtractError(null);
    setConfidences({});
    setView('review');
  }

  async function saveEncounter() {
    setSaveEncounterError(null);
    setIsSavingEncounter(true);
    const encounter = {
      id: `enc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: encounterDate,
      source: captureMode || 'manual',
      transcript: captureMode === 'voice' ? transcript : null,
      fields: editableFields,
      confidences,
      createdAt: new Date().toISOString(),
    };
    try {
      if (!window.storage) throw new Error('Storage is not available in this preview.');
      let list = [];
      try {
        const res = await window.storage.get(`encounters:${selectedPatientId}`, false);
        list = res ? JSON.parse(res.value) : [];
      } catch (e) {
        list = [];
      }
      list.push(encounter);
      await window.storage.set(`encounters:${selectedPatientId}`, JSON.stringify(list), false);
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setEncounters(list);
      setView('patient');
    } catch (err) {
      console.error('Failed to save encounter', err);
      setSaveEncounterError((err && err.message) || 'Could not save this encounter. Please try again.');
    } finally {
      setIsSavingEncounter(false);
    }
  }

  async function resetAllData() {
    if (!window.confirm('Erase all patients and encounters stored in this prototype? This cannot be undone.')) return;
    try {
      await window.storage.set('patients-index', JSON.stringify([]), false);
      for (const p of patients) {
        try { await window.storage.delete(`encounters:${p.id}`, false); } catch (e) {}
      }
    } catch (e) {}
    setPatients([]);
    setEncounters([]);
    setSelectedPatientId(null);
    setView('list');
  }

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800">
      <div className="sticky top-0 z-10 bg-slate-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-400" />
            <div>
              <div className="font-semibold leading-tight">PainEHR</div>
              <div className="text-[11px] text-slate-400 leading-tight">personal prototype — v1</div>
            </div>
          </div>
          <button onClick={resetAllData} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> reset
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2 my-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Prototype for testing. Use synthetic or de-identified patients only until your institution has cleared this for real patient data.</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {view === 'list' && (
          <ListView
            loading={loadingPatients}
            patients={filteredPatients}
            search={search}
            setSearch={setSearch}
            onSelect={openPatient}
            onNew={() => setView('newPatient')}
          />
        )}

        {view === 'newPatient' && (
          <NewPatientView
            form={newPatientForm}
            setForm={setNewPatientForm}
            onSubmit={handleAddPatient}
            onBack={() => setView('list')}
            error={addPatientError}
            isSaving={isSavingPatient}
          />
        )}

        {view === 'patient' && selectedPatient && (
          <PatientView
            patient={selectedPatient}
            encounters={encounters}
            loading={loadingEncounters}
            expandedEncounterId={expandedEncounterId}
            setExpandedEncounterId={setExpandedEncounterId}
            onBack={() => setView('list')}
            onNewEncounter={startNewEncounter}
          />
        )}

        {view === 'capture' && (
          <CaptureView
            captureMode={captureMode}
            setCaptureMode={setCaptureMode}
            photoPreview={photoPreview}
            onPhotoChange={handlePhotoChange}
            transcript={transcript}
            setTranscript={setTranscript}
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            speechSupported={speechSupported}
            isExtracting={isExtracting}
            onExtract={runExtraction}
            onSkip={skipToManualReview}
            onBack={() => setView('patient')}
          />
        )}

        {view === 'review' && (
          <ReviewView
            date={encounterDate}
            setDate={setEncounterDate}
            fields={editableFields}
            setFields={setEditableFields}
            confidences={confidences}
            error={extractError}
            saveError={saveEncounterError}
            isSaving={isSavingEncounter}
            onSave={saveEncounter}
            onBack={() => setView('capture')}
          />
        )}
      </div>
    </div>
  );
}

function ListView({ loading, patients, search, setSearch, onSelect, onNew }) {
  return (
    <div className="pt-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button onClick={onNew} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm font-medium">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center">Loading…</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <User className="w-8 h-8 mx-auto mb-2" />
          <div className="text-sm">No patients yet. Add your first one to get started.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full text-left bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-teal-300 transition"
            >
              <div>
                <div className="font-medium text-slate-800">{p.name}</div>
                <div className="text-xs text-slate-400">
                  {[p.age && `${p.age}y`, p.sex, p.phone].filter(Boolean).join(' · ') || 'no details'}
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewPatientView({ form, setForm, onSubmit, onBack, error, isSaving }) {
  return (
    <div className="pt-2">
      <BackButton onClick={onBack} label="Patients" />
      <h2 className="text-lg font-semibold mt-2 mb-4">New patient</h2>
      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Name" required>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </Field>
          <Field label="Sex">
            <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">—</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>
        <Field label="Phone (optional)">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </Field>
        <button type="submit" disabled={isSaving} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium mt-2">
          {isSaving ? 'Saving…' : 'Save patient'}
        </button>
      </form>
    </div>
  );
}

function PatientView({ patient, encounters, loading, expandedEncounterId, setExpandedEncounterId, onBack, onNewEncounter }) {
  return (
    <div className="pt-2">
      <BackButton onClick={onBack} label="Patients" />
      <div className="flex items-center justify-between mt-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold">{patient.name}</h2>
          <div className="text-xs text-slate-400">{[patient.age && `${patient.age}y`, patient.sex, patient.phone].filter(Boolean).join(' · ')}</div>
        </div>
        <button onClick={onNewEncounter} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm font-medium">
          <Plus className="w-4 h-4" /> Encounter
        </button>
      </div>

      <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> Timeline
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center">Loading…</div>
      ) : encounters.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No encounters recorded yet.</div>
      ) : (
        <div className="space-y-2">
          {encounters.map((enc) => {
            const expanded = expandedEncounterId === enc.id;
            return (
              <div key={enc.id} className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                <button className="w-full text-left flex items-center justify-between" onClick={() => setExpandedEncounterId(expanded ? null : enc.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{enc.date}</span>
                      <TypeBadge type={enc.fields?.encounterType} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {enc.fields?.diagnosis || 'No diagnosis recorded'}
                      {enc.fields?.painScoreNrs !== '' && enc.fields?.painScoreNrs != null && (
                        <span className="ml-2 tabular-nums font-medium text-slate-700">NRS {enc.fields.painScoreNrs}/10</span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className={`w-4 h-4 text-slate-300 transition-transform ${expanded ? 'rotate-90' : '-rotate-90'}`} />
                </button>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
                    <DetailRow label="Chief complaint" value={enc.fields?.chiefComplaint} />
                    <DetailRow label="Procedure" value={enc.fields?.procedure} />
                    <DetailRow label="Plan" value={enc.fields?.plan} />
                    <DetailRow label="Notes" value={enc.fields?.notes} />
                    <div className="text-[11px] text-slate-400 pt-1">source: {enc.source}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CaptureView({ captureMode, setCaptureMode, photoPreview, onPhotoChange, transcript, setTranscript, isRecording, toggleRecording, speechSupported, isExtracting, onExtract, onSkip, onBack }) {
  const canExtract = (captureMode === 'photo' && photoPreview) || (captureMode === 'voice' && transcript.trim().length > 0);
  return (
    <div className="pt-2">
      <BackButton onClick={onBack} label="Patient" />
      <h2 className="text-lg font-semibold mt-2 mb-4">New encounter</h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setCaptureMode('photo')}
          className={`rounded-lg border px-4 py-4 flex flex-col items-center gap-2 text-sm font-medium transition ${captureMode === 'photo' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
        >
          <Camera className="w-5 h-5" /> Photo
        </button>
        <button
          onClick={() => setCaptureMode('voice')}
          className={`rounded-lg border px-4 py-4 flex flex-col items-center gap-2 text-sm font-medium transition ${captureMode === 'voice' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
        >
          <Mic className="w-5 h-5" /> Voice
        </button>
      </div>

      {captureMode === 'photo' && (
        <div className="space-y-3">
          <label className="block border-2 border-dashed border-slate-200 rounded-lg py-8 text-center cursor-pointer hover:border-teal-300 transition">
            <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className="hidden" />
            {photoPreview ? (
              <img src={photoPreview} alt="capture preview" className="max-h-64 mx-auto rounded" />
            ) : (
              <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                <Camera className="w-6 h-6" />
                Tap to take or choose a photo
              </div>
            )}
          </label>
        </div>
      )}

      {captureMode === 'voice' && (
        <div className="space-y-3">
          {speechSupported ? (
            <button
              onClick={toggleRecording}
              className={`w-full rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium ${isRecording ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? 'Stop recording' : 'Start recording'}
            </button>
          ) : (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Voice recognition isn't supported in this browser — type or paste the transcript below.
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
        <div className="mt-5 space-y-2">
          <button
            disabled={!canExtract || isExtracting}
            onClick={onExtract}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2"
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isExtracting ? 'Extracting…' : 'Extract with AI'}
          </button>
          <button onClick={onSkip} className="w-full text-slate-500 text-xs py-1 hover:text-slate-700">
            Skip AI and enter fields manually
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewView({ date, setDate, fields, setFields, confidences, error, saveError, isSaving, onSave, onBack }) {
  function update(key, value) {
    setFields({ ...fields, [key]: value });
  }
  return (
    <div className="pt-2">
      <BackButton onClick={onBack} label="Capture" />
      <h2 className="text-lg font-semibold mt-2 mb-1">Review & verify</h2>
      <p className="text-xs text-slate-400 mb-4">Nothing is saved to this patient's record until you confirm it below.</p>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}
      {saveError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">{saveError}</div>
      )}

      <div className="space-y-3">
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </Field>
        <Field label="Encounter type">
          <select value={fields.encounterType} onChange={(e) => update('encounterType', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="new">New</option>
            <option value="followup">Follow-up</option>
            <option value="procedure">Procedure</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <VerifiedField label="Chief complaint" value={fields.chiefComplaint} confidence={confidences.chief_complaint} onChange={(v) => update('chiefComplaint', v)} />
        <VerifiedField label="Diagnosis" value={fields.diagnosis} confidence={confidences.diagnosis} onChange={(v) => update('diagnosis', v)} />
        <VerifiedField label="Pain score (NRS 0–10)" value={fields.painScoreNrs} confidence={confidences.pain_score_nrs} onChange={(v) => update('painScoreNrs', v)} type="number" />
        <VerifiedField label="Procedure" value={fields.procedure} confidence={confidences.procedure} onChange={(v) => update('procedure', v)} />
        <VerifiedField label="Plan" value={fields.plan} confidence={confidences.plan} onChange={(v) => update('plan', v)} textarea />
        <Field label="Notes">
          <textarea value={fields.notes} onChange={(e) => update('notes', e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </Field>
      </div>

      <button onClick={onSave} disabled={isSaving} className="w-full mt-5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {isSaving ? 'Saving…' : 'Save to patient record'}
      </button>
    </div>
  );
}

function VerifiedField({ label, value, confidence, onChange, type = 'text', textarea = false }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
        {confidence && <ConfidenceBadge confidence={confidence} />}
      </div>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }) {
  const styles = CONF_STYLES[confidence] || CONF_STYLES.low;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide ${styles} flex items-center gap-1`}>
      {confidence === 'low' && <AlertTriangle className="w-2.5 h-2.5" />}
      {confidence}
    </span>
  );
}

function TypeBadge({ type }) {
  const labels = { new: 'New', followup: 'Follow-up', procedure: 'Procedure', other: 'Other' };
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium uppercase tracking-wide">{labels[type] || 'New'}</span>;
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}: </span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
      <ChevronLeft className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
