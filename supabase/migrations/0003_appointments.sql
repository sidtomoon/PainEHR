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
