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
