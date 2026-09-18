-- Migration: Bezeichnung für Rechnungen, damit sie leichter zu finden sind
-- Im Supabase SQL Editor ausführen (nach migration_buchhaltung.sql)

alter table invoices add column title text;
