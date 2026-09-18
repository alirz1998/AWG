-- Migration: Buchhaltung (Rechnungen scannen & nach Monat ablegen)
-- Im Supabase SQL Editor ausführen

-- Eigene Rolle für einen reinen Buchhaltungs-Zugang: sieht nur die
-- Rechnungen aller Mitarbeiter, keine Kundendaten (kein is_awg_staff()).
alter type user_role add value 'buchhaltung';

create table invoices (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  invoice_date date not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

alter table invoices enable row level security;

-- Admin und Buchhaltung sehen alle Rechnungen, normales Team nur die eigenen.
create or replace function can_view_all_invoices()
returns boolean as $$
  select exists (
    select 1 from user_project_roles
    where user_id = auth.uid()
    and role in ('awg_admin', 'buchhaltung')
  );
$$ language sql security definer;

create policy "Staff legt eigene Rechnungen an" on invoices
  for insert with check (is_awg_staff() and uploaded_by = auth.uid());

create policy "Rechnungen sehen: eigene oder alle je Rolle" on invoices
  for select using (uploaded_by = auth.uid() or can_view_all_invoices());

create policy "Rechnungen löschen: eigene oder Admin/Buchhaltung" on invoices
  for delete using (uploaded_by = auth.uid() or can_view_all_invoices());

-- Storage-Bucket für gescannte Rechnungen (privat)
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Dateipfad ist "{user_id}/{dateiname}", der erste Pfad-Teil bestimmt also,
-- wem die Rechnung ursprünglich gehört.
create policy "Staff lädt eigene Rechnungen hoch" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'invoices'
    and is_awg_staff()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Rechnungen im Storage sehen" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or can_view_all_invoices()
    )
  );

create policy "Rechnungen im Storage löschen" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'invoices'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or can_view_all_invoices()
    )
  );
