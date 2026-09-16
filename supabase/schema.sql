-- AWG Kunden-Onboarding App: Basis-Datenbankschema
-- In Supabase: SQL Editor -> New Query -> diesen Inhalt einfügen -> Run

-- Rollen, die ein Nutzer innerhalb eines Projekts haben kann
create type user_role as enum (
  'geschaeftsfuehrer',
  'inhaber',
  'marketingabteilung',
  'ansprechperson',
  'awg_team',
  'awg_admin'
);

create type service_type as enum (
  'social_media',
  'webdesign',
  'druckprodukte',
  'grafikdesign',
  'foto_video'
);

-- Kundenfirmen
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  branche text,
  created_at timestamptz not null default now()
);

-- Projekte pro Firma (eine Firma kann mehrere Dienstleistungen/Projekte haben)
create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  service_type service_type not null,
  status text not null default 'onboarding', -- onboarding, aktiv, abgeschlossen
  created_at timestamptz not null default now()
);

-- Verknüpfung: welcher Nutzer hat welche Rolle in welchem Projekt
-- Das ist die zentrale Tabelle für Zugriffsrechte
create table user_project_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

-- Einladungen (Kunden registrieren sich nur über einen gültigen Link)
create table invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  role user_role not null,
  token uuid not null default gen_random_uuid(),
  status text not null default 'offen', -- offen, angenommen, abgelaufen
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

-- Zugangsdaten je Projekt (z. B. Metricool-Login für den Kunden)
create table credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  platform_name text not null,
  login text,
  -- Passwort wird verschlüsselt gespeichert, nie im Klartext
  encrypted_password text,
  notes text,
  created_at timestamptz not null default now()
);

-- Antworten auf den Zielgruppenanalyse-Fragebogen
create table questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  section text not null, -- z.B. 'ueber_die_person', 'aktuelle_zielgruppe', ...
  question_key text not null,
  answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dokumente (unterschriebenes Angebot / Vertrag etc.)
create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  doc_type text not null, -- 'vertrag', 'angebot', 'rechnung' (später)
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

-- ==== Row Level Security: Kunde sieht nur eigene Projekte ====

alter table companies enable row level security;
alter table projects enable row level security;
alter table user_project_roles enable row level security;
alter table credentials enable row level security;
alter table questionnaire_responses enable row level security;
alter table documents enable row level security;

-- Hilfsfunktion: hat der aktuelle Nutzer Zugriff auf dieses Projekt?
create or replace function has_project_access(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from user_project_roles
    where project_id = p_project_id
    and user_id = auth.uid()
  );
$$ language sql security definer;

-- Hilfsfunktion: ist der aktuelle Nutzer AWG-Team oder Admin (sieht mehr)?
create or replace function is_awg_staff()
returns boolean as $$
  select exists (
    select 1 from user_project_roles
    where user_id = auth.uid()
    and role in ('awg_team', 'awg_admin')
  );
$$ language sql security definer;

create policy "Nutzer sehen nur eigene Projekte" on projects
  for select using (has_project_access(id) or is_awg_staff());

create policy "Nutzer sehen nur eigene Firma" on companies
  for select using (
    exists (
      select 1 from projects
      where projects.company_id = companies.id
      and (has_project_access(projects.id) or is_awg_staff())
    )
  );

create policy "Nutzer sehen eigene Zugangsdaten" on credentials
  for select using (has_project_access(project_id) or is_awg_staff());

create policy "Nutzer sehen eigene Fragebogen-Antworten" on questionnaire_responses
  for select using (has_project_access(project_id) or is_awg_staff());

create policy "Nutzer sehen eigene Dokumente" on documents
  for select using (has_project_access(project_id) or is_awg_staff());

create policy "Nutzer sehen eigene Rollen" on user_project_roles
  for select using (user_id = auth.uid() or is_awg_staff());
