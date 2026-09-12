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
