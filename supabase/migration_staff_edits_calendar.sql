-- Migration: Staff darf bestehende Termine und Meetings bearbeiten
-- (z. B. nachträglich eine Notiz oder ein Dokument hinzufügen)
-- Im Supabase SQL Editor ausführen

create policy "Staff bearbeitet Termine" on calendar_entries
  for update using (is_awg_staff()) with check (is_awg_staff());

create policy "Staff bearbeitet Meetings" on meetings
  for update using (is_awg_staff()) with check (is_awg_staff());
