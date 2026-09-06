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
