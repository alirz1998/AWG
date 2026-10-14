-- Migration: Staff darf Projekte bearbeiten (z. B. Status ändern).
-- projects hat bisher nur SELECT/INSERT/DELETE-Policies für Staff, kein
-- UPDATE, deshalb schlägt jede Änderung (z. B. der Laufend/Abgeschlossen-
-- Toggle) lautlos fehl.
-- Im Supabase SQL Editor ausführen

create policy "Staff bearbeitet Projekte" on projects
  for update using (is_awg_staff()) with check (is_awg_staff());
