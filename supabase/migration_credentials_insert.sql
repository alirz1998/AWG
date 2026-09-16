-- Migration: Staff darf Zugangsdaten für Projekte anlegen
-- Im Supabase SQL Editor ausführen

create policy "Staff legt Zugangsdaten an" on credentials
  for insert with check (is_awg_staff());
