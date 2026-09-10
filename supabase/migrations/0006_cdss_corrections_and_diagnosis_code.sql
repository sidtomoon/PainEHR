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
