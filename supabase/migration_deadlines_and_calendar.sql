-- Migration: Deadlines und Termin-Kalender, je nach Projekttyp relevant
-- (z. B. Liefertermine für Webdesign/Druckprodukte/Grafikdesign,
-- Dreh-/Content-Termine für Foto&Video/Social Media)
-- Im Supabase SQL Editor ausführen

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  due_date date not null,
  created_at timestamptz not null default now()
);

alter table deadlines enable row level security;

create policy "Nutzer sehen eigene Deadlines" on deadlines
  for select using (has_project_access(project_id) or is_awg_staff());

create policy "Staff legt Deadlines an" on deadlines
  for insert with check (is_awg_staff());

create policy "Staff löscht Deadlines" on deadlines
  for delete using (is_awg_staff());

create table calendar_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table calendar_entries enable row level security;

create policy "Nutzer sehen eigene Termine" on calendar_entries
  for select using (has_project_access(project_id) or is_awg_staff());

create policy "Staff legt Termine an" on calendar_entries
  for insert with check (is_awg_staff());

create policy "Staff löscht Termine" on calendar_entries
  for delete using (is_awg_staff());
