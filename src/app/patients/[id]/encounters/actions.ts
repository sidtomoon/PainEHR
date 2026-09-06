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

  const { data: encounter, error } = await supabase
    .from('encounters')
    .insert({
      patient_id: patientId,
      encounter_date: str(formData, 'encounter_date'),
      encounter_type: (str(formData, 'encounter_type') || 'new') as EncounterType,
      source,
      transcript: str(formData, 'transcript'),

      ai_chief_complaint: str(formData, 'ai_chief_complaint'),
      ai_diagnosis: str(formData, 'ai_diagnosis'),
      ai_pain_location: str(formData, 'ai_pain_location') as PainLocation | null,
      ai_pain_score_nrs: num(formData, 'ai_pain_score_nrs'),
      ai_procedure: str(formData, 'ai_procedure'),
      ai_plan: str(formData, 'ai_plan'),
      ai_notes: str(formData, 'ai_notes'),
      ai_confidence: aiConfidence,

      chief_complaint: str(formData, 'chief_complaint'),
      diagnosis: str(formData, 'diagnosis'),
      pain_location: str(formData, 'pain_location') as PainLocation | null,
      pain_score_nrs: num(formData, 'pain_score_nrs'),
      procedure: str(formData, 'procedure'),
      plan: str(formData, 'plan'),
      notes: str(formData, 'notes'),
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
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

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
