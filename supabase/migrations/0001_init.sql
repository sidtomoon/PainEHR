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
