-- Migration: Links, die AWG dem Kunden zur Verfügung stellt
-- (z. B. geteilter Ordner, externes Formular, Moodboard)
-- Im Supabase SQL Editor ausführen

create table links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table links enable row level security;

create policy "Nutzer sehen eigene Links" on links
  for select using (has_project_access(project_id) or is_awg_staff());

create policy "Staff legt Links an" on links
  for insert with check (is_awg_staff());

create policy "Staff löscht Links" on links
  for delete using (is_awg_staff());
