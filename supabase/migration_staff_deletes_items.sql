-- Migration: Staff darf Zugangsdaten und Einladungen löschen.
-- (Links, Meetings, Deadlines, Termine, Dokumente hatten die Policy schon,
-- nur der Button in der App fehlte.)
-- Im Supabase SQL Editor ausführen

create policy "Staff löscht Einladungen" on invitations
  for delete using (is_awg_staff());

-- get_credentials liefert jetzt zusätzlich die id, damit ein Eintrag
-- gezielt gelöscht werden kann. Rückgabetyp ändert sich -> erst droppen.
drop function if exists get_credentials(uuid);

create function get_credentials(p_project_id uuid)
returns table (
  id uuid,
  platform_name text,
  login text,
  password text,
  notes text
) as $$
begin
  if not (has_project_access(p_project_id) or is_awg_staff()) then
    raise exception 'Keine Berechtigung.';
  end if;

  return query
    select
      c.id,
      c.platform_name,
      c.login,
      pgp_sym_decrypt(c.encrypted_password, get_encryption_key()),
      c.notes
    from credentials c
    where c.project_id = p_project_id;
end;
$$ language plpgsql security definer;

-- Direkter Tabellenzugriff auf credentials ist gesperrt, daher Löschen per Funktion
create function delete_credential(p_credential_id uuid)
returns void as $$
begin
  if not is_awg_staff() then
    raise exception 'Keine Berechtigung.';
  end if;

  delete from credentials where id = p_credential_id;
end;
$$ language plpgsql security definer;
