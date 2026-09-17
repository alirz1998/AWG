-- Migration: AWG-Team-Mitglieder per Link einladen (kein Kunde, keine Firma/Projekt nötig)
-- Im Supabase SQL Editor ausführen (nach migration_admin_invites.sql)

-- Bisher musste jede Einladung zu einer Firma gehören. Team-Einladungen
-- (Rolle awg_team / awg_admin) gehören zu keiner Firma, deshalb wird
-- company_id für sie optional (project_id ist das schon, siehe
-- migration_admin_invites.sql).
alter table invitations alter column company_id drop not null;
