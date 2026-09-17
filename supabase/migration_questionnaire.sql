-- Migration: Zielgruppenanalyse-Fragebogen ausfüllen & aktualisieren
-- Im Supabase SQL Editor ausführen

-- Pro Projekt und Frage nur eine Antwort-Zeile, damit erneutes Ausfüllen
-- die alte Antwort überschreibt (upsert) statt Duplikate anzulegen.
alter table questionnaire_responses
  add constraint questionnaire_responses_project_question_unique
  unique (project_id, question_key);

-- Kunde (mit Zugriff aufs Projekt) und Staff dürfen Antworten anlegen/ändern.
create policy "Nutzer schreiben eigene Fragebogen-Antworten" on questionnaire_responses
  for insert with check (has_project_access(project_id) or is_awg_staff());

create policy "Nutzer aktualisieren eigene Fragebogen-Antworten" on questionnaire_responses
  for update using (has_project_access(project_id) or is_awg_staff());
