-- Migration: Staff darf bestehenden Nutzern direkt Zugriff auf ein neues
-- Projekt geben (z. B. wenn ein Kunde ein zweites Projekt bekommt), ohne
-- dass sie sich erneut über eine Einladung registrieren müssen.
-- Im Supabase SQL Editor ausführen

create policy "Staff vergibt Projekt-Rollen" on user_project_roles
  for insert with check (is_awg_staff());
