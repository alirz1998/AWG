-- Fix: Staff soll neu angelegte Firmen direkt sehen können,
-- auch bevor ein Projekt dafür existiert.
-- Im Supabase SQL Editor ausführen.

create policy "Staff sieht alle Firmen" on companies
  for select using (is_awg_staff());
