-- Migration: Zugangsdaten (Passwörter) verschlüsselt speichern
-- Im Supabase SQL Editor ausführen, SCHRITT FÜR SCHRITT (siehe Anleitung)

-- 1) Verschlüsselungs-Erweiterung aktivieren
create extension if not exists pgcrypto;

-- 2) Geheimen Schlüssel im Supabase Vault anlegen.
--    WICHTIG: Ersetze den Beispiel-Schlüssel unten durch einen eigenen,
--    zufälligen (40+ Zeichen, wahllos getippt). Diese Zeile separat ausführen:
--
-- select vault.create_secret('HIER-DEIN-EIGENER-ZUFALLS-SCHLÜSSEL', 'credentials_encryption_key');

-- 3) Bestehende Klartext-Spalte umbenennen (falls schon Testdaten drin sind, werden diese unlesbar -
--    das ist ok, es sind nur unsere Testdaten)
alter table credentials rename column encrypted_password to password_plaintext_backup;
alter table credentials add column encrypted_password bytea;

-- Hilfsfunktion: holt den Schlüssel sicher aus dem Vault
create or replace function get_encryption_key()
returns text as $$
  select decrypted_secret from vault.decrypted_secrets
  where name = 'credentials_encryption_key';
$$ language sql security definer;

-- 4) Sichere Funktion: Zugangsdaten anlegen (verschlüsselt automatisch)
create or replace function add_credential(
  p_project_id uuid,
  p_platform_name text,
  p_login text,
  p_password text,
  p_notes text
)
returns void as $$
begin
  if not is_awg_staff() then
    raise exception 'Keine Berechtigung.';
  end if;

  insert into credentials (project_id, platform_name, login, encrypted_password, notes)
  values (
    p_project_id,
    p_platform_name,
    p_login,
    pgp_sym_encrypt(p_password, get_encryption_key()),
    p_notes
  );
end;
$$ language plpgsql security definer;

-- 5) Sichere Funktion: Zugangsdaten für ein Projekt lesen (nur wer Zugriff hat)
create or replace function get_credentials(p_project_id uuid)
returns table (
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
      c.platform_name,
      c.login,
      pgp_sym_decrypt(c.encrypted_password, get_encryption_key()),
      c.notes
    from credentials c
    where c.project_id = p_project_id;
end;
$$ language plpgsql security definer;

-- 6) Alte Klartext-Backup-Spalte löschen, nachdem alles läuft
-- (diese Zeile erst NACH dem Testen ausführen)
-- alter table credentials drop column password_plaintext_backup;

-- 7) Direktes Lesen/Schreiben von credentials über die normale API sperren -
--    ab jetzt läuft alles nur noch über add_credential() und get_credentials()
drop policy if exists "Nutzer sehen eigene Zugangsdaten" on credentials;
drop policy if exists "Staff legt Zugangsdaten an" on credentials;
