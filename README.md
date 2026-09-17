# AWG Onboarding App — v1

## Was schon drin ist
- Next.js-Projekt mit Tailwind, TypeScript
- Supabase angebunden (Client + Server)
- Datenbankschema (`supabase/schema.sql`) für: companies, projects, user_project_roles,
  invitations, credentials, questionnaire_responses, documents — inkl. Zugriffsregeln
  (Row Level Security), sodass ein Kunde nur sein eigenes Projekt sieht
- Login-Seite (`/login`)
- Einladungs-Registrierungsseite (`/einladung/[token]`)

## Nächste Schritte, um es lokal laufen zu lassen
1. `.env.local.example` zu `.env.local` kopieren und mit deinen Supabase-Werten füllen
   (Supabase Dashboard -> Project Settings -> API)
2. In Supabase: SQL Editor öffnen, Inhalt von `supabase/schema.sql` einfügen und ausführen,
   danach der Reihe nach auch alle `supabase/migration_*.sql`-Dateien ausführen
3. `npm install`
4. `npm run dev`
5. Im Browser: http://localhost:3000/login

## Noch zu bauen (nächste Schritte im Projekt)
- Zielgruppenanalyse-Fragebogen für Kunden (Tabelle `questionnaire_responses`
  existiert schon, UI fehlt noch)
- Dashboard-Ansicht für AWG-Team: projektübergreifende Sicht, TODOs
  (aktuell nur Links zu den Admin-Seiten)

Erledigt seit der ersten Version:
- Einladung annehmen läuft über eine Datenbank-Funktion (`accept_invitation`,
  siehe `migration_admin_invites.sql`) statt über eine eigene API-Route
- Admin-Ansicht: neue Einladung erstellen
- Dashboard für Kunden: Zugangsdaten
- Verträge/Angebote/Rechnungen/Dokumente: Admin lädt sie hoch
  (`/admin/dokumente`, privater Storage-Bucket `documents`), Kunden sehen und
  laden sie im Dashboard herunter (zeitlich begrenzte Download-Links)
- Neue AWG-Team-Mitglieder per Einladungslink hinzufügen (`/admin/team`,
  braucht `migration_staff_invites.sql`) — läuft über denselben
  Einladungs-Mechanismus wie Kunden, nur ohne Firma/Projekt

## Deployment
Sobald es lokal läuft: Projekt auf GitHub pushen, dann auf vercel.com importieren
und die gleichen Umgebungsvariablen dort eintragen.
