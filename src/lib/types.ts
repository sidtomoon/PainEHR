export type SexType = 'M' | 'F' | 'Other';
export type EncounterType = 'new' | 'followup' | 'procedure' | 'other';
export type CaptureSource = 'photo' | 'voice' | 'manual';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type PainLocation =
  | 'cervical' | 'lumbar' | 'thoracic' | 'shoulder' | 'hip' | 'knee'
  | 'neuropathic' | 'widespread' | 'other';
export type PainMechanism = 'nociceptive' | 'neuropathic' | 'nociplastic' | 'mixed';
export type ImagingConcordance = 'concordant' | 'discordant' | 'not_imaged';
export type GoalOfCare = 'curative' | 'palliative' | 'other';
export type ProcedureCategory =
  | 'diagnostic_block' | 'therapeutic_block' | 'neurolytic_procedure'
  | 'neuromodulation' | 'other';
export type ProcedureGuidance = 'ultrasound' | 'fluoroscopy' | 'ct' | 'blind' | 'other';
export type ProcedureIntent = 'diagnostic' | 'therapeutic' | 'neurolytic';
export type FunctionalChange = 'improved' | 'static' | 'worse';
export type AppointmentType = 'followup' | 'procedure';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type PatientGlobalImpression = 'much_worse' | 'worse' | 'no_change' | 'better' | 'much_better';
export type AnnouncementRecipientStatus = 'pending' | 'sent' | 'failed';
export type CheckinType = 'day3_postop_pgic';

export type MediaType =
  | 'xray'
  | 'mri'
  | 'ct'
  | 'ultrasound'
  | 'procedure_photo'
  | 'procedure_video'
  | 'lab_report'
  | 'other';

export interface Patient {
  id: string;
  patient_code: string;
  name: string;
  age: number | null;
  sex: SexType | null;
  phone: string | null;
  research_consent: boolean | null;
  research_consent_date: string | null;
  whatsapp_opt_in: boolean;
  whatsapp_opt_in_date: string | null;
  onedrive_folder_url?: string | null;
  created_at: string;
}

export interface PatientMedia {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  user_id: string | null;
  media_type: MediaType;
  title: string;
  url: string;
  scan_date: string;
  notes: string | null;
  created_at: string;
}

export interface EncounterConfidence {
  chief_complaint?: ConfidenceLevel;
  diagnosis?: ConfidenceLevel;
  pain_location?: ConfidenceLevel;
  pain_score_nrs?: ConfidenceLevel;
  procedure?: ConfidenceLevel;
  plan?: ConfidenceLevel;
}

export interface Encounter {
  id: string;
  patient_id: string;
  encounter_date: string;
  encounter_type: EncounterType;
  source: CaptureSource;
  transcript: string | null;

  ai_chief_complaint: string | null;
  ai_diagnosis: string | null;
  ai_pain_location: PainLocation | null;
  ai_pain_score_nrs: number | null;
  ai_procedure: string | null;
  ai_plan: string | null;
  ai_notes: string | null;
  ai_confidence: EncounterConfidence;

  chief_complaint: string | null;
  diagnosis: string | null;
  pain_location: PainLocation | null;
  pain_score_nrs: number | null;
  procedure: string | null;
  plan: string | null;
  notes: string | null;
  verified_at: string | null;
  diagnosis_code: string | null;

  pain_mechanism: PainMechanism | null;
  past_history: string | null;
  past_treatments: string | null;
  functional_impact: string | null;
  red_flags: string | null;
  diagnosis_confidence: ConfidenceLevel | null;
  imaging_concordance: ImagingConcordance | null;
  is_cancer_pain: boolean | null;
  cancer_type: string | null;
  metastatic_disease: boolean | null;
  oncologic_treatment: string | null;
  goal_of_care: GoalOfCare | null;

  // Procedure visit
  procedure_category: ProcedureCategory | null;
  procedure_level_laterality: string | null;
  procedure_guidance: ProcedureGuidance | null;
  drugs_used: string | null;
  procedure_intent: ProcedureIntent | null;
  immediate_pain_relief_nrs: number | null;
  immediate_complications: string | null;
  planned_followup_interval: string | null;

  // Follow-up visit
  functional_change: FunctionalChange | null;
  reintervention_needed: boolean | null;
  learning_point: string | null;

  // Outcomes (single-item proxies — see V2_SCOPE.md)
  function_score_0_10: number | null;
  mood_score_0_10: number | null;
  sleep_score_0_10: number | null;
  qol_score_0_10: number | null;
  widespread_pain: boolean | null;
  patient_global_impression: PatientGlobalImpression | null;
  adverse_event: string | null;

  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  created_from_encounter_id: string | null;
  appointment_type: AppointmentType;
  scheduled_date: string;
  scheduled_time: string | null;
  location: string | null;
  status: AppointmentStatus;
  notes: string | null;
  reminder_sent_at: string | null;
  created_at: string;
}

export interface PatientCheckin {
  id: string;
  patient_id: string;
  source_encounter_id: string | null;
  checkin_type: CheckinType;
  token: string;
  sent_at: string | null;
  patient_global_impression: PatientGlobalImpression | null;
  responded_at: string | null;
  created_at: string;
}

export interface PatientOutcomesSummary {
  patient_id: string;
  patient_code: string;
  name: string;
  research_consent: boolean | null;
  baseline_date: string | null;
  baseline_pain: number | null;
  baseline_function: number | null;
  baseline_mood: number | null;
  baseline_sleep: number | null;
  baseline_qol: number | null;
  latest_date: string | null;
  latest_pain: number | null;
  latest_function: number | null;
  latest_mood: number | null;
  latest_sleep: number | null;
  latest_qol: number | null;
  latest_global_impression: PatientGlobalImpression | null;
  latest_diagnosis: string | null;
  latest_pain_location: PainLocation | null;
  pain_change: number | null;
  pain_change_pct: number | null;
}

export interface Announcement {
  id: string;
  message: string;
  sent_at: string | null;
  created_at: string;
}

export interface AnnouncementRecipient {
  id: string;
  announcement_id: string;
  patient_id: string;
  status: AnnouncementRecipientStatus;
  provider_message_id: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ExtractionResult {
  encounter_type: EncounterType;
  chief_complaint: string | null;
  diagnosis: string | null;
  pain_location: PainLocation | null;
  pain_score_nrs: number | null;
  procedure: string | null;
  plan: string | null;
  notes: string | null;
  confidence: EncounterConfidence;
}

export const PAIN_LOCATIONS: PainLocation[] = [
  'cervical', 'lumbar', 'thoracic', 'shoulder', 'hip', 'knee',
  'neuropathic', 'widespread', 'other',
];

export const PAIN_MECHANISMS: PainMechanism[] = ['nociceptive', 'neuropathic', 'nociplastic', 'mixed'];
export const IMAGING_CONCORDANCES: ImagingConcordance[] = ['concordant', 'discordant', 'not_imaged'];
export const GOALS_OF_CARE: GoalOfCare[] = ['curative', 'palliative', 'other'];
export const PROCEDURE_CATEGORIES: ProcedureCategory[] = [
  'diagnostic_block', 'therapeutic_block', 'neurolytic_procedure', 'neuromodulation', 'other',
];
export const PROCEDURE_GUIDANCES: ProcedureGuidance[] = ['ultrasound', 'fluoroscopy', 'ct', 'blind', 'other'];
export const PROCEDURE_INTENTS: ProcedureIntent[] = ['diagnostic', 'therapeutic', 'neurolytic'];
export const FUNCTIONAL_CHANGES: FunctionalChange[] = ['improved', 'static', 'worse'];
export const PATIENT_GLOBAL_IMPRESSIONS: PatientGlobalImpression[] = [
  'much_worse', 'worse', 'no_change', 'better', 'much_better',
];

export type CdssStage = 'extraction' | 'history' | 'exam' | 'investigation' | 'ddx' | 'treatment';

export interface CdssCorrection {
  id: string;
  encounter_id: string;
  stage: CdssStage;
  field_name: string;
  suggested_value: string | null;
  final_value: string | null;
  created_at: string;
}

export type LeaveType = 'leave' | 'conference' | 'ot_day' | 'holiday' | 'other';

export interface DoctorLeave {
  id: string;
  user_id: string;
  title: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  all_day: boolean;
  notes: string | null;
  created_at: string;
}

export type AppointmentWithPatient = Appointment & {
  patient: Pick<Patient, 'id' | 'name' | 'patient_code' | 'phone'>;
};

export type UserRole = 'admin' | 'data_entry';

export interface ClinicUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}


