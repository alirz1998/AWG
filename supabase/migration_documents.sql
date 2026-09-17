-- Migration: Dokumente (Vertrag / Angebot) hochladen & anzeigen
-- Im Supabase SQL Editor ausführen (nach schema.sql)

-- Storage-Bucket für Dokumente (privat, kein öffentlicher Zugriff)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Staff darf Dokument-Zeilen anlegen und löschen
create policy "Staff legt Dokumente an" on documents
  for insert with check (is_awg_staff());

create policy "Staff löscht Dokumente" on documents
  for delete using (is_awg_staff());

-- Storage-Policies: Dateipfad ist "{project_id}/{dateiname}",
-- der erste Pfad-Teil bestimmt also, zu welchem Projekt die Datei gehört.
create policy "Staff lädt Dokumente hoch" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and is_awg_staff()
  );

create policy "Nutzer sehen eigene Dokumente im Storage" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      is_awg_staff()
      or has_project_access((storage.foldername(name))[1]::uuid)
    )
  );

create policy "Staff löscht Dokumente im Storage" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and is_awg_staff()
  );
