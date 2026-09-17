-- Beispieldaten zum Ausprobieren: ein paar Kunden mit unterschiedlichen
-- Projekttypen, damit man Deadlines/Termine gleich live sehen kann.
-- Im Supabase SQL Editor ausführen. Kann mehrfach laufen (legt bei
-- jedem Lauf neue Beispiel-Kunden an).

do $$
declare
  v_company_id uuid;
  v_project_id uuid;
begin
  -- Kunde 1: Social Media -> bekommt einen Termin-Kalender
  insert into companies (name, branche, kundennummer) values ('Café Sonnenschein', 'Gastronomie', '1001') returning id into v_company_id;
  insert into projects (company_id, service_type) values (v_company_id, 'social_media') returning id into v_project_id;
  insert into calendar_entries (project_id, title, scheduled_at) values
    (v_project_id, 'Content-Shooting Frühling', now() + interval '5 days'),
    (v_project_id, 'Reel-Dreh Sommer-Menü', now() + interval '19 days');

  -- Kunde 2: Webdesign -> bekommt Deadlines
  insert into companies (name, branche, kundennummer) values ('Fischer Bau GmbH', 'Bauwesen', '1002') returning id into v_company_id;
  insert into projects (company_id, service_type) values (v_company_id, 'webdesign') returning id into v_project_id;
  insert into deadlines (project_id, title, due_date) values
    (v_project_id, 'Launch neue Website', current_date + interval '21 days');
  insert into links (project_id, title, url) values
    (v_project_id, 'Staging-Vorschau', 'https://staging.fischerbau.example.com');

  -- Kunde 3: Foto & Video -> bekommt einen Termin-Kalender
  insert into companies (name, branche, kundennummer) values ('Studio Mode', 'Mode & Lifestyle', '1003') returning id into v_company_id;
  insert into projects (company_id, service_type) values (v_company_id, 'foto_video') returning id into v_project_id;
  insert into calendar_entries (project_id, title, scheduled_at) values
    (v_project_id, 'Lookbook-Shooting Herbstkollektion', now() + interval '9 days');

  -- Kunde 4: Druckprodukte -> bekommt Deadlines
  insert into companies (name, branche, kundennummer) values ('Kanzlei Weber & Partner', 'Recht', '1004') returning id into v_company_id;
  insert into projects (company_id, service_type) values (v_company_id, 'druckprodukte') returning id into v_project_id;
  insert into deadlines (project_id, title, due_date) values
    (v_project_id, 'Drucktermin Visitenkarten', current_date + interval '4 days');
end $$;
