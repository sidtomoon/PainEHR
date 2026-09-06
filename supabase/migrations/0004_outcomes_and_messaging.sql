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
