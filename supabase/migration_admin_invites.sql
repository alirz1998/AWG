-- Migration: Admin-Einladungsfunktion
-- Im Supabase SQL Editor ausführen (nach schema.sql)

-- AWG-Team-Mitglieder (Rolle awg_team / awg_admin) gehören zu keinem
-- bestimmten Kundenprojekt, deshalb wird project_id für sie optional.
alter table user_project_roles alter column project_id drop not null;

-- Nur AWG-Staff darf neue Firmen, Projekte und Einladungen anlegen
create policy "Staff legt Firmen an" on companies
  for insert with check (is_awg_staff());

create policy "Staff legt Projekte an" on projects
  for insert with check (is_awg_staff());

create policy "Staff legt Einladungen an" on invitations
  for insert with check (is_awg_staff());

create policy "Staff sieht Einladungen" on invitations
  for select using (is_awg_staff());

-- Sichere Funktion zum Einlösen einer Einladung:
-- läuft mit erweiterten Rechten (security definer), prüft aber genau,
-- dass die einladende E-Mail zum eingeloggten Nutzer passt und die
-- Einladung noch gültig ist, bevor sie den Nutzer dem Projekt zuweist.
create or replace function accept_invitation(p_token uuid)
returns void as $$
declare
  v_invite invitations%rowtype;
  v_user_email text;
begin
  select email into v_user_email from auth.users where id = auth.uid();

  select * into v_invite from invitations
    where token = p_token
    and status = 'offen'
    and expires_at > now();

  if v_invite is null then
    raise exception 'Einladung ist ungültig oder abgelaufen.';
  end if;

  if v_invite.email <> v_user_email then
    raise exception 'Diese Einladung gehört zu einer anderen E-Mail-Adresse.';
  end if;

  insert into user_project_roles (user_id, project_id, role)
    values (auth.uid(), v_invite.project_id, v_invite.role)
    on conflict (user_id, project_id) do nothing;

  update invitations set status = 'angenommen' where id = v_invite.id;
end;
$$ language plpgsql security definer;
