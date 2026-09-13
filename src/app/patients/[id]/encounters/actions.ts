'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  AppointmentType, CaptureSource, EncounterConfidence, EncounterType, FunctionalChange, GoalOfCare,
  ImagingConcordance, PainLocation, PainMechanism, PatientGlobalImpression, ProcedureCategory,
  ProcedureGuidance, ProcedureIntent,
} from '@/lib/types';

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  return v === null ? null : Number(v);
}

function bool(formData: FormData, key: string) {
  const v = str(formData, key);
  return v === 'yes' ? true : v === 'no' ? false : null;
}

export async function saveEncounter(patientId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const source = (str(formData, 'source') || 'manual') as CaptureSource;
  const aiConfidence: EncounterConfidence = JSON.parse(str(formData, 'ai_confidence') || '{}');

  // --- AI draft values (what the AI suggested) ---
  const aiChiefComplaint = str(formData, 'ai_chief_complaint');
  const aiDiagnosis = str(formData, 'ai_diagnosis');
  const aiPainLocation = str(formData, 'ai_pain_location') as PainLocation | null;
  const aiPainScoreNrs = num(formData, 'ai_pain_score_nrs');
  const aiProcedure = str(formData, 'ai_procedure');
  const aiPlan = str(formData, 'ai_plan');
  const aiNotes = str(formData, 'ai_notes');

  // --- Clinician-verified values (what was actually saved) ---
  const chiefComplaint = str(formData, 'chief_complaint');
  const diagnosis = str(formData, 'diagnosis');
  const painLocation = str(formData, 'pain_location') as PainLocation | null;
  const painScoreNrs = num(formData, 'pain_score_nrs');
  const procedure = str(formData, 'procedure');
  const plan = str(formData, 'plan');
  const notes = str(formData, 'notes');
  const pastHistory = str(formData, 'past_history');
  const pastTreatments = str(formData, 'past_treatments');

  const basePayload = {
    patient_id: patientId,
    encounter_date: str(formData, 'encounter_date'),
    encounter_type: (str(formData, 'encounter_type') || 'new') as EncounterType,
    source,
    transcript: str(formData, 'transcript'),

    ai_chief_complaint: aiChiefComplaint,
    ai_diagnosis: aiDiagnosis,
    ai_pain_location: aiPainLocation,
    ai_pain_score_nrs: aiPainScoreNrs,
    ai_procedure: aiProcedure,
    ai_plan: aiPlan,
    ai_notes: aiNotes,
    ai_confidence: aiConfidence,

    chief_complaint: chiefComplaint,
    diagnosis,
    diagnosis_code: str(formData, 'diagnosis_code'),
    pain_location: painLocation,
    pain_score_nrs: painScoreNrs,
    procedure,
    plan,
    verified_at: new Date().toISOString(),

    pain_mechanism: str(formData, 'pain_mechanism') as PainMechanism | null,
    functional_impact: str(formData, 'functional_impact'),
    red_flags: str(formData, 'red_flags'),
    diagnosis_confidence: str(formData, 'diagnosis_confidence') as 'high' | 'medium' | 'low' | null,
    imaging_concordance: str(formData, 'imaging_concordance') as ImagingConcordance | null,
    is_cancer_pain: bool(formData, 'is_cancer_pain'),
    cancer_type: str(formData, 'cancer_type'),
    metastatic_disease: bool(formData, 'metastatic_disease'),
    oncologic_treatment: str(formData, 'oncologic_treatment'),
    goal_of_care: str(formData, 'goal_of_care') as GoalOfCare | null,

    procedure_category: str(formData, 'procedure_category') as ProcedureCategory | null,
    procedure_level_laterality: str(formData, 'procedure_level_laterality'),
    procedure_guidance: str(formData, 'procedure_guidance') as ProcedureGuidance | null,
    drugs_used: str(formData, 'drugs_used'),
    procedure_intent: str(formData, 'procedure_intent') as ProcedureIntent | null,
    immediate_pain_relief_nrs: num(formData, 'immediate_pain_relief_nrs'),
    immediate_complications: str(formData, 'immediate_complications'),
    planned_followup_interval: str(formData, 'planned_followup_interval'),

    functional_change: str(formData, 'functional_change') as FunctionalChange | null,
    reintervention_needed: bool(formData, 'reintervention_needed'),
    learning_point: str(formData, 'learning_point'),

    function_score_0_10: num(formData, 'function_score_0_10'),
    mood_score_0_10: num(formData, 'mood_score_0_10'),
    sleep_score_0_10: num(formData, 'sleep_score_0_10'),
    qol_score_0_10: num(formData, 'qol_score_0_10'),
    widespread_pain: bool(formData, 'widespread_pain'),
    patient_global_impression: str(formData, 'patient_global_impression') as PatientGlobalImpression | null,
    adverse_event: str(formData, 'adverse_event'),
  };

  // Try inserting with dedicated past_history & past_treatments columns
  let encounter: { id: string } | null = null;
  const { data: enc1, error: err1 } = await supabase
    .from('encounters')
    .insert({
      ...basePayload,
      notes,
      past_history: pastHistory,
      past_treatments: pastTreatments,
    })
    .select('id')
    .single();

  if (!err1 && enc1) {
    encounter = enc1;
  } else if (err1 && (err1.message.includes('past_history') || err1.message.includes('past_treatments') || err1.code === 'PGRST204')) {
    // Fallback if columns are not yet added in Supabase
    const combinedNotes = [
      notes,
      pastHistory ? `[Past Medical & Surgical History]:\n${pastHistory}` : null,
      pastTreatments ? `[Past Treatments & Interventions]:\n${pastTreatments}` : null,
    ].filter(Boolean).join('\n\n');

    const { data: enc2, error: err2 } = await supabase
      .from('encounters')
      .insert({
        ...basePayload,
        notes: combinedNotes || null,
      })
      .select('id')
      .single();

    if (err2) throw new Error(err2.message);
    encounter = enc2;
  } else if (err1) {
    throw new Error(err1.message);
  }

  if (!encounter) {
    throw new Error('Failed to create encounter');
  }

  // --- CDSS correction logging ---
  // When AI extraction was used, compare each AI draft field against the
  // clinician's verified value. Any difference gets logged to cdss_corrections
  // for later retrieval (RAG) and pattern analysis.
  if (source !== 'manual') {
    const diffs: { field_name: string; suggested_value: string | null; final_value: string | null }[] = [];

    const pairs: [string, string | number | null, string | number | null][] = [
      ['chief_complaint', aiChiefComplaint, chiefComplaint],
      ['diagnosis', aiDiagnosis, diagnosis],
      ['pain_location', aiPainLocation, painLocation],
      ['pain_score_nrs', aiPainScoreNrs, painScoreNrs],
      ['procedure', aiProcedure, procedure],
      ['plan', aiPlan, plan],
    ];

    for (const [field, suggested, final] of pairs) {
      // Only log when the AI actually proposed something and the clinician changed it
      if (suggested != null && String(suggested) !== String(final ?? '')) {
        diffs.push({
          field_name: field,
          suggested_value: String(suggested),
          final_value: final != null ? String(final) : null,
        });
      }
    }

    if (diffs.length > 0) {
      await supabase.from('cdss_corrections').insert(
        diffs.map((d) => ({
          encounter_id: encounter.id,
          stage: 'extraction' as const,
          ...d,
        })),
      );
    }
  }

  // --- Attachment upload ---
  const file = formData.get('attachment');
  if (file instanceof File && file.size > 0) {
    const path = `${user.id}/${encounter.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file, {
      contentType: file.type,
    });
    if (!uploadError) {
      await supabase.from('attachments').insert({
        encounter_id: encounter.id,
        kind: source,
        storage_path: path,
        media_type: file.type,
      });
    }
  }

  // --- Optional next appointment ---
  const scheduleType = str(formData, 'schedule_type') as AppointmentType | null;
  const scheduleDate = str(formData, 'schedule_date');
  if (scheduleType && scheduleDate) {
    await supabase.from('appointments').insert({
      patient_id: patientId,
      created_from_encounter_id: encounter.id,
      appointment_type: scheduleType,
      scheduled_date: scheduleDate,
      scheduled_time: str(formData, 'schedule_time'),
      location: str(formData, 'schedule_location'),
    });
  }

  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}
