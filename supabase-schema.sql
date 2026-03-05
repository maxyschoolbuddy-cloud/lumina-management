-- ================================================================
-- LUMINA Management System — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- 1. USERS
create table if not exists lm_users (
  id bigint generated always as identity primary key,
  name text not null,
  username text not null unique,
  pass text not null,
  role text not null default 'staff',
  status text not null default 'Active',
  created_at timestamptz default now()
);

-- 2. PROJECTS
create table if not exists lm_projects (
  id bigint generated always as identity primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 3. TASKS
create table if not exists lm_tasks (
  id bigint generated always as identity primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 4. EMPLOYEES
create table if not exists lm_employees (
  id bigint generated always as identity primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 5. EQUIPMENT
create table if not exists lm_equipment (
  id bigint generated always as identity primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 6. SCHEDULES
create table if not exists lm_schedules (
  id bigint generated always as identity primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 7. REVIEWS
create table if not exists lm_reviews (
  id bigint generated always as identity primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 8. ACTIVITIES (log)
create table if not exists lm_activities (
  id bigint generated always as identity primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- ================================================================
-- DISABLE Row Level Security (ໃຊ້ anon key ເຂົ້າຫາຂໍ້ມູນໄດ້ເລີຍ)
-- ================================================================
alter table lm_users       enable row level security;
alter table lm_projects    enable row level security;
alter table lm_tasks       enable row level security;
alter table lm_employees   enable row level security;
alter table lm_equipment   enable row level security;
alter table lm_schedules   enable row level security;
alter table lm_reviews     enable row level security;
alter table lm_activities  enable row level security;

-- Allow anon to do everything (app handles auth itself)
create policy "allow all lm_users"      on lm_users      for all using (true) with check (true);
create policy "allow all lm_projects"   on lm_projects   for all using (true) with check (true);
create policy "allow all lm_tasks"      on lm_tasks      for all using (true) with check (true);
create policy "allow all lm_employees"  on lm_employees  for all using (true) with check (true);
create policy "allow all lm_equipment"  on lm_equipment  for all using (true) with check (true);
create policy "allow all lm_schedules"  on lm_schedules  for all using (true) with check (true);
create policy "allow all lm_reviews"    on lm_reviews    for all using (true) with check (true);
create policy "allow all lm_activities" on lm_activities for all using (true) with check (true);

-- ================================================================
-- INSERT default admin user
-- ================================================================
insert into lm_users (name, username, pass, role, status)
values ('Administrator', 'admin', 'admin1234', 'admin', 'Active')
on conflict (username) do nothing;

-- ================================================================
-- DONE ✓  ຫຼັງຈາກ run ແລ້ວ ລະບົບ LUMINA ພ້ອມໃຊ້ງານ
-- ================================================================
