-- Migration: Staff darf Kunden (Firmen) und Projekte löschen.
-- Alle abhängigen Zeilen (Projekte, Dokumente, Links, Zugangsdaten,
-- Zielgruppenanalyse-Antworten, Deadlines, Termine, Zugriffe, Einladungen)
-- hängen bereits per "on delete cascade" daran und werden automatisch
-- mitgelöscht. Referenzielle Integritätsprüfungen (also auch Cascade-
-- Löschungen) umgehen Row Level Security immer, deshalb reichen diese
-- zwei Policies auf den obersten Tabellen.
-- Im Supabase SQL Editor ausführen

create policy "Staff löscht Firmen" on companies
  for delete using (is_awg_staff());

create policy "Staff löscht Projekte" on projects
  for delete using (is_awg_staff());
