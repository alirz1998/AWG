-- Migration: Meetings (Termin + Notizen), sichtbar für Kunde und Staff
-- Im Supabase SQL Editor ausführen

create table meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  meeting_date timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table meetings enable row level security;

create policy "Nutzer sehen eigene Meetings" on meetings
  for select using (has_project_access(project_id) or is_awg_staff());

create policy "Staff legt Meetings an" on meetings
  for insert with check (is_awg_staff());

create policy "Staff löscht Meetings" on meetings
  for delete using (is_awg_staff());
