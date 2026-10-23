-- PainEHR initial schema: Patient and Encounter as separate, normalized entities.
-- Controlled vocabularies (enums) used where the predecessor system relied on free text.

create extension if not exists pgcrypto;

create type sex_type as enum ('M', 'F', 'Other');
create type encounter_type as enum ('new', 'followup', 'procedure', 'other');
create type capture_source as enum ('photo', 'voice', 'manual');
create type confidence_level as enum ('high', 'medium', 'low');
create type pain_location as enum (
  'cervical', 'lumbar', 'thoracic', 'shoulder', 'hip', 'knee',
  'neuropathic', 'widespread', 'other'
);

-- Sequence-backed patient code (e.g. PT-000001) so encounters always link to a
-- stable, enforced identifier instead of relying on free-text name matching.
create sequence patient_code_seq;

create table patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  patient_code text not null unique default ('PT-' || lpad(nextval('patient_code_seq')::text, 6, '0')),
  name text not null,
  age int check (age >= 0 and age <= 130),
  sex sex_type,
  phone text,
  created_at timestamptz not null default now()
);

create table encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_date date not null default current_date,
  encounter_type encounter_type not null default 'new',
  source capture_source not null default 'manual',
  transcript text,

  -- AI-drafted values and their confidence, kept separate from the
  -- clinician-verified values below so provenance is never lost.
  ai_chief_complaint text,
  ai_diagnosis text,
  ai_pain_location pain_location,
  ai_pain_score_nrs int check (ai_pain_score_nrs between 0 and 10),
  ai_procedure text,
  ai_plan text,
  ai_notes text,
  ai_confidence jsonb not null default '{}'::jsonb,

  -- Clinician-verified values: null until a human confirms, at which point
  -- this row is the record of truth, never the ai_* columns above.
  chief_complaint text,
  diagnosis text,
  pain_location pain_location,
  pain_score_nrs int check (pain_score_nrs between 0 and 10),
  procedure text,
  plan text,
  notes text,
  verified_at timestamptz,

  created_at timestamptz not null default now()
);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  encounter_id uuid not null references encounters(id) on delete cascade,
  kind capture_source not null,
  storage_path text not null,
  media_type text,
  created_at timestamptz not null default now()
);

create index encounters_patient_id_idx on encounters(patient_id);
create index attachments_encounter_id_idx on attachments(encounter_id);

-- Row-Level Security: scoped per user_id even though today there is one
-- clinician, so adding a second user later needs no schema change.
alter table patients enable row level security;
alter table encounters enable row level security;
alter table attachments enable row level security;

create policy "own patients" on patients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own encounters" on encounters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own attachments" on attachments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Per-encounter-type fields, informed by the predecessor Google Form
-- ("Unified Longitudinal Pain Registry & CDSS"). That form flattened
-- new/procedure/follow-up visits into one row per entry; here each field
-- group is still columns on `encounters` (kept as one table, not split,
-- since Encounter is already the per-visit entity) but scoped by
-- encounter_type in the application layer instead of one giant form.

create type pain_mechanism as enum ('nociceptive', 'neuropathic', 'nociplastic', 'mixed');
create type imaging_concordance as enum ('concordant', 'discordant', 'not_imaged');
create type goal_of_care as enum ('curative', 'palliative', 'other');
create type procedure_category as enum (
  'diagnostic_block', 'therapeutic_block', 'neurolytic_procedure',
  'neuromodulation', 'other'
);
create type procedure_guidance as enum ('ultrasound', 'fluoroscopy', 'ct', 'blind', 'other');
create type procedure_intent as enum ('diagnostic', 'therapeutic', 'neurolytic');
create type functional_change as enum ('improved', 'static', 'worse');

alter table encounters
  -- New / follow-up assessment
  add column pain_mechanism pain_mechanism,
  add column functional_impact text,
  add column red_flags text,
  add column diagnosis_confidence confidence_level,
  add column imaging_concordance imaging_concordance,
  add column is_cancer_pain boolean,
  add column cancer_type text,
  add column metastatic_disease boolean,
  add column oncologic_treatment text,
  add column goal_of_care goal_of_care,

  -- Procedure visit
  add column procedure_category procedure_category,
  add column procedure_level_laterality text,
  add column procedure_guidance procedure_guidance,
  add column drugs_used text,
  add column procedure_intent procedure_intent,
  add column immediate_pain_relief_nrs int check (immediate_pain_relief_nrs between 0 and 10),
  add column immediate_complications text,
  add column planned_followup_interval text,

  -- Follow-up visit
  add column functional_change functional_change,
  add column reintervention_needed boolean,
  add column learning_point text;
-- A scheduled future visit is a different entity from a completed Encounter
-- (no assessment data yet, can be cancelled/rescheduled) — same reasoning as
-- keeping Patient and Encounter separate, so it gets its own table rather
-- than bolting date columns onto `encounters`.

create type appointment_type as enum ('followup', 'procedure');
create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

create table appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  patient_id uuid not null references patients(id) on delete cascade,
  created_from_encounter_id uuid references encounters(id) on delete set null,
  appointment_type appointment_type not null,
  scheduled_date date not null,
  status appointment_status not null default 'scheduled',
  notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index appointments_patient_id_idx on appointments(patient_id);
create index appointments_scheduled_date_idx on appointments(scheduled_date) where status = 'scheduled';

alter table appointments enable row level security;
create policy "own appointments" on appointments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Research-grade outcome fields: single-item proxies per IMMPACT/PRECISION-registry
-- domain (see V2_SCOPE.md), deliberately NOT full multi-item questionnaires so a
-- busy OPD visit can still capture them in seconds.

create type patient_global_impression as enum ('much_worse', 'worse', 'no_change', 'better', 'much_better');

alter table encounters
  add column function_score_0_10 int check (function_score_0_10 between 0 and 10),
  add column mood_score_0_10 int check (mood_score_0_10 between 0 and 10),
  add column sleep_score_0_10 int check (sleep_score_0_10 between 0 and 10),
  add column qol_score_0_10 int check (qol_score_0_10 between 0 and 10),
  add column widespread_pain boolean,
  add column patient_global_impression patient_global_impression,
  add column adverse_event text;

-- Consent tracking: clinical-care consent already assumed; research use and
-- WhatsApp messaging are separate opt-ins, per the project's governance gate.
alter table patients
  add column research_consent boolean,
  add column research_consent_date date,
  add column whatsapp_opt_in boolean not null default false,
  add column whatsapp_opt_in_date date;

-- Properly-computed outcomes views (replaces the predecessor's broken
-- spreadsheet formulas — LATEST_STATUS / RESPONDER_TRAJECTORY — with real
-- server-side joins).

-- security_invoker so these views enforce the querying user's RLS on
-- patients/encounters, rather than running with the view owner's privileges.
create view patient_baseline_encounter with (security_invoker = true) as
select distinct on (patient_id)
  patient_id, id as encounter_id, encounter_date,
  pain_score_nrs, function_score_0_10, mood_score_0_10, sleep_score_0_10, qol_score_0_10
from encounters
order by patient_id, encounter_date asc, created_at asc;

create view patient_latest_encounter with (security_invoker = true) as
select distinct on (patient_id)
  patient_id, id as encounter_id, encounter_date,
  pain_score_nrs, function_score_0_10, mood_score_0_10, sleep_score_0_10, qol_score_0_10,
  patient_global_impression, diagnosis, pain_location
from encounters
order by patient_id, encounter_date desc, created_at desc;

create view patient_outcomes_summary with (security_invoker = true) as
select
  p.id as patient_id,
  p.patient_code,
  p.name,
  p.research_consent,
  b.encounter_date as baseline_date,
  b.pain_score_nrs as baseline_pain,
  b.function_score_0_10 as baseline_function,
  b.mood_score_0_10 as baseline_mood,
  b.sleep_score_0_10 as baseline_sleep,
  b.qol_score_0_10 as baseline_qol,
  l.encounter_date as latest_date,
  l.pain_score_nrs as latest_pain,
  l.function_score_0_10 as latest_function,
  l.mood_score_0_10 as latest_mood,
  l.sleep_score_0_10 as latest_sleep,
  l.qol_score_0_10 as latest_qol,
  l.patient_global_impression as latest_global_impression,
  l.diagnosis as latest_diagnosis,
  l.pain_location as latest_pain_location,
  (b.pain_score_nrs - l.pain_score_nrs) as pain_change,
  case when b.pain_score_nrs > 0
    then round(100.0 * (b.pain_score_nrs - l.pain_score_nrs) / b.pain_score_nrs, 1)
    else null end as pain_change_pct
from patients p
left join patient_baseline_encounter b on b.patient_id = p.id
left join patient_latest_encounter l on l.patient_id = p.id;

-- Announcements: broadcast messages (doctor unavailability, clinic location,
-- etc.) separate from per-appointment reminders, with per-patient delivery
-- tracking rather than fire-and-forget.

create type announcement_recipient_status as enum ('pending', 'sent', 'failed');

create table announcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  message text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table announcement_recipients (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  status announcement_recipient_status not null default 'pending',
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index announcement_recipients_announcement_id_idx on announcement_recipients(announcement_id);

alter table announcements enable row level security;
alter table announcement_recipients enable row level security;

create policy "own announcements" on announcements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own announcement recipients" on announcement_recipients for all
  using (exists (select 1 from announcements a where a.id = announcement_id and a.user_id = auth.uid()))
  with check (exists (select 1 from announcements a where a.id = announcement_id and a.user_id = auth.uid()));
-- "When & where" for a scheduled procedure/follow-up.
alter table appointments
  add column scheduled_time time,
  add column location text;

-- Day-3 post-op PGIC check-in. A patient self-report is NOT the same thing
-- as a clinician-verified Encounter — it's an unverified data point awaiting
-- review, so it gets its own table rather than being folded into encounters.
-- Delivered as a WhatsApp message containing a link to a token-gated public
-- page (parsing free-text WhatsApp replies would need an inbound-webhook
-- integration per provider; a link is far simpler and just as effective).
create type checkin_type as enum ('day3_postop_pgic');

create table patient_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  patient_id uuid not null references patients(id) on delete cascade,
  source_encounter_id uuid references encounters(id) on delete set null,
  checkin_type checkin_type not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  sent_at timestamptz,
  patient_global_impression patient_global_impression,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index patient_checkins_patient_id_idx on patient_checkins(patient_id);
create unique index patient_checkins_token_idx on patient_checkins(token);
-- One day-3 check-in per source encounter, so the cron job can't double-send.
create unique index patient_checkins_source_encounter_type_idx
  on patient_checkins(source_encounter_id, checkin_type);

alter table patient_checkins enable row level security;
create policy "own checkins" on patient_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- CDSS correction logging + ICD-11 diagnosis code support
-- See implementation_plan.md for rationale.

-- 1. Correction logging table: records every AI suggestion vs. clinician's
--    actual saved value, per field, per encounter. Foundation for retrieval-
--    augmented "learning" (RAG over past corrections) without model retraining.

create table cdss_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  encounter_id uuid not null references encounters(id) on delete cascade,
  stage text not null,           -- 'extraction', 'history', 'exam' (future stages added as built)
  field_name text not null,      -- e.g. 'chief_complaint', 'diagnosis', 'pain_location'
  suggested_value text,          -- what the AI proposed
  final_value text,              -- what the clinician actually saved
  created_at timestamptz not null default now()
);

create index cdss_corrections_encounter_id_idx on cdss_corrections(encounter_id);
create index cdss_corrections_field_stage_idx on cdss_corrections(field_name, stage);

alter table cdss_corrections enable row level security;
create policy "own corrections" on cdss_corrections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Diagnosis code on encounters: nullable text, not an enum, because ICD codes
--    expand over time and are better validated at the application layer.
alter table encounters add column diagnosis_code text;
-- Migration 0007: Calendar & Doctor Leaves / Clinic Schedule Blockers

create type if not exists leave_type as enum ('leave', 'conference', 'ot_day', 'holiday', 'other');

create table if not exists doctor_leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  title text not null,
  leave_type text not null default 'leave',
  start_date date not null,
  end_date date not null,
  all_day boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists doctor_leaves_dates_idx on doctor_leaves(start_date, end_date);

alter table doctor_leaves enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'doctor_leaves' and policyname = 'own doctor_leaves'
  ) then
    create policy "own doctor_leaves" on doctor_leaves for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
-- Migration 0008: User Roles (Admin vs Data Entry) & Shared Clinic Registry

-- 1. User roles table
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  email text not null unique,
  role text not null check (role in ('admin', 'data_entry')) default 'data_entry',
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists user_roles_user_id_idx on user_roles(user_id);
create index if not exists user_roles_email_idx on user_roles(email);

alter table user_roles enable row level security;

-- Authenticated users can view user_roles (to know who is admin / who entered records)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'user_roles' and policyname = 'read user_roles') then
    create policy "read user_roles" on user_roles for select
      using (auth.role() = 'authenticated');
  end if;
end $$;

-- 2. Helper function to check if current user is admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Update RLS policies on clinic tables to allow shared clinic access
-- All authenticated staff can read and insert patients, encounters, appointments
-- Only admin can delete records or manage doctor leaves

-- Patients: shared clinic view & insert
drop policy if exists "own patients" on patients;
drop policy if exists "clinic read patients" on patients;
drop policy if exists "clinic insert patients" on patients;
drop policy if exists "clinic update patients" on patients;
drop policy if exists "admin delete patients" on patients;

create policy "clinic read patients" on patients for select
  using (auth.role() = 'authenticated');

create policy "clinic insert patients" on patients for insert
  with check (auth.role() = 'authenticated');

create policy "clinic update patients" on patients for update
  using (auth.role() = 'authenticated');

create policy "admin delete patients" on patients for delete
  using (is_admin() or auth.uid() = user_id);

-- Encounters: shared clinic access
drop policy if exists "own encounters" on encounters;
drop policy if exists "clinic read encounters" on encounters;
drop policy if exists "clinic insert encounters" on encounters;
drop policy if exists "clinic update encounters" on encounters;
drop policy if exists "admin delete encounters" on encounters;

create policy "clinic read encounters" on encounters for select
  using (auth.role() = 'authenticated');

create policy "clinic insert encounters" on encounters for insert
  with check (auth.role() = 'authenticated');

create policy "clinic update encounters" on encounters for update
  using (auth.role() = 'authenticated');

create policy "admin delete encounters" on encounters for delete
  using (is_admin() or auth.uid() = user_id);

-- Appointments: shared clinic access
drop policy if exists "own appointments" on appointments;
drop policy if exists "clinic read appointments" on appointments;
drop policy if exists "clinic insert appointments" on appointments;
drop policy if exists "clinic update appointments" on appointments;
drop policy if exists "clinic delete appointments" on appointments;

create policy "clinic read appointments" on appointments for select
  using (auth.role() = 'authenticated');

create policy "clinic insert appointments" on appointments for insert
  with check (auth.role() = 'authenticated');

create policy "clinic update appointments" on appointments for update
  using (auth.role() = 'authenticated');

create policy "clinic delete appointments" on appointments for delete
  using (auth.role() = 'authenticated');

-- Doctor Leaves: readable by all clinic staff, but only admin can insert/update/delete
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'doctor_leaves') then
    execute 'drop policy if exists "own doctor_leaves" on doctor_leaves';
    execute 'drop policy if exists "clinic read doctor_leaves" on doctor_leaves';
    execute 'drop policy if exists "admin manage doctor_leaves" on doctor_leaves';

    execute 'create policy "clinic read doctor_leaves" on doctor_leaves for select using (auth.role() = ''authenticated'')';
    execute 'create policy "admin manage doctor_leaves" on doctor_leaves for all using (is_admin() or auth.uid() = user_id) with check (is_admin() or auth.uid() = user_id)';
  end if;
end $$;

-- 4. Seed admin role for Dr. Varun and sidtomoon if user already exists
insert into user_roles (user_id, email, role, display_name)
select id, email, 'admin', 'Dr. Varun Singla'
from auth.users
where email in ('sidtomoon@gmail.com', 'drvarunsinglapgi@gmail.com')
on conflict (user_id) do update
set role = 'admin', display_name = 'Dr. Varun Singla';
-- Migration 0009: Past Medical/Surgical History & Past Treatments
alter table encounters add column if not exists past_history text;
alter table encounters add column if not exists past_treatments text;
-- Migration 0010: Patient Media (OneDrive / Cloud Storage) & Imaging Vault

-- 1. Add OneDrive master folder URL to patients table
alter table patients add column if not exists onedrive_folder_url text;

-- 2. Create patient_media table for itemized scans, photos, and videos
create table if not exists patient_media (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id) on delete set null,
  user_id uuid references auth.users(id) default auth.uid(),
  media_type text not null check (
    media_type in ('xray', 'mri', 'ct', 'ultrasound', 'procedure_photo', 'procedure_video', 'lab_report', 'other')
  ),
  title text not null,
  url text not null,
  scan_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists patient_media_patient_idx on patient_media(patient_id, scan_date desc);
create index if not exists patient_media_encounter_idx on patient_media(encounter_id);

alter table patient_media enable row level security;

-- 3. RLS Policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'patient_media' and policyname = 'clinic read patient_media') then
    create policy "clinic read patient_media" on patient_media for select using (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'patient_media' and policyname = 'clinic insert patient_media') then
    create policy "clinic insert patient_media" on patient_media for insert with check (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'patient_media' and policyname = 'clinic update patient_media') then
    create policy "clinic update patient_media" on patient_media for update using (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'patient_media' and policyname = 'clinic delete patient_media') then
    create policy "clinic delete patient_media" on patient_media for delete using (auth.role() = 'authenticated');
  end if;
end $$;
-- Migration 0011: Patient Prescriptions & OPD Queue Support

-- 1. Create patient_prescriptions table
create table if not exists patient_prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id) on delete set null,
  user_id uuid references auth.users(id) default auth.uid(),
  items jsonb not null default '[]'::jsonb,
  advice text,
  created_at timestamptz not null default now()
);

create index if not exists patient_prescriptions_patient_idx on patient_prescriptions(patient_id, created_at desc);
create index if not exists patient_prescriptions_encounter_idx on patient_prescriptions(encounter_id);

alter table patient_prescriptions enable row level security;

-- 2. RLS Policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'patient_prescriptions' and policyname = 'clinic read patient_prescriptions') then
    create policy "clinic read patient_prescriptions" on patient_prescriptions for select using (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'patient_prescriptions' and policyname = 'clinic insert patient_prescriptions') then
    create policy "clinic insert patient_prescriptions" on patient_prescriptions for insert with check (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'patient_prescriptions' and policyname = 'clinic update patient_prescriptions') then
    create policy "clinic update patient_prescriptions" on patient_prescriptions for update using (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where tablename = 'patient_prescriptions' and policyname = 'clinic delete patient_prescriptions') then
    create policy "clinic delete patient_prescriptions" on patient_prescriptions for delete using (auth.role() = 'authenticated');
  end if;
end $$;
