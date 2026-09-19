-- Migration: Persönlicher Kalender-Abo-Link (iCalendar-Feed)
-- Im Supabase SQL Editor ausführen

-- Ein Token pro Nutzer, über das der Kalender-Feed (ohne Login, wie es
-- Kalender-Apps brauchen) eindeutig und geheim abrufbar ist.
create table calendar_feed_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table calendar_feed_tokens enable row level security;

create policy "Nutzer sieht eigenen Token" on calendar_feed_tokens
  for select using (user_id = auth.uid());

create policy "Nutzer legt eigenen Token an" on calendar_feed_tokens
  for insert with check (user_id = auth.uid());
