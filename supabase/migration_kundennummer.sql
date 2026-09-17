-- Migration: Kundennummer je Firma, die das AWG-Team dem Kunden zuweist
-- Im Supabase SQL Editor ausführen

alter table companies add column kundennummer text;

create policy "Staff bearbeitet Firmen" on companies
  for update using (is_awg_staff()) with check (is_awg_staff());
