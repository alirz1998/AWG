-- Migration: Dokument (z. B. Shotlist, Briefing) an einen Dreh-/Content-Termin
-- anhängen. Nutzt denselben privaten Storage-Bucket "documents" und dieselbe
-- Pfad-Konvention ("{project_id}/{dateiname}") wie Projekt-Dokumente, daher
-- sind keine neuen Storage-Policies nötig.
-- Im Supabase SQL Editor ausführen

alter table calendar_entries add column file_url text;
