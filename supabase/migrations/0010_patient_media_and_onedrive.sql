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
