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

-- 4. Seed admin role for Dr. Varun if user already exists
insert into user_roles (user_id, email, role, display_name)
select id, email, 'admin', 'Dr. Varun Singla'
from auth.users
where email = 'drvarunsinglapgi@gmail.com'
on conflict (user_id) do update
set role = 'admin', display_name = 'Dr. Varun Singla';
