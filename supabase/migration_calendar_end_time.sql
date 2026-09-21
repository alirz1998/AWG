-- Migration: Endzeit für Drehtermine/Shootings
-- Im Supabase SQL Editor ausführen
--
-- Optional (kann leer bleiben) - damit Termine mit einer echten Dauer
-- im abonnierten Kalender angezeigt werden, statt als Kurz-Eintrag.
alter table calendar_entries add column scheduled_end timestamptz;
