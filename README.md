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
- Vorname/Nachname werden bei der Registrierung abgefragt (gespeichert in
  Supabase Auth user metadata) und im Dashboard als "Willkommen, Vorname"
  angezeigt, statt der E-Mail-Adresse. Gilt nur für neu registrierte
  Konten — bereits bestehende Konten ohne Namen zeigen weiterhin die
  E-Mail-Adresse als Fallback.
- Dashboard-Ansicht für AWG-Team: `/admin/projekte` zeigt alle Firmen/Projekte,
  `/admin/projekte/[id]` zeigt für ein einzelnes Projekt genau das, was der
  Kunde selbst sieht (Zugangsdaten, Zielgruppenanalyse, Dokumente) —
  read-only für Staff
- Zielgruppenanalyse-Fragebogen (`/fragebogen`, braucht
  `migration_questionnaire.sql`): feste Multiple-Choice-Fragen mit optionalem
  Freitext-Feld pro Frage. Kunde kann die Antworten jederzeit erneut öffnen
  und aktualisieren (Upsert pro Projekt+Frage). AWG-Team sieht die
  aktuellen Antworten im Dashboard und unter `/admin/projekte/[id]`, und
  darf sie auch selbst bearbeiten (`/fragebogen?project=<id>`)
- Kunden und Projekte sind in der Admin-Ansicht getrennt: `/admin/kunden`
  zeigt alle Firmen, `/admin/kunden/[id]` zeigt eine Firma mit all ihren
  Projekten (eine Firma kann mehrere Projekte haben — war schon im
  Datenmodell so, jetzt auch in der UI sichtbar). Von einem Projekt
  (`/admin/projekte/[id]`) geht es zurück zur zugehörigen Firma. Kunden mit
  mehreren eigenen Projekten sehen im Dashboard einen Umschalter zwischen
  ihren Projekten
- Links, die AWG dem Kunden bereitstellt, z. B. geteilte Ordner oder externe
  Formulare (`/admin/links`, braucht `migration_links.sql`) — landen als
  eigener Abschnitt im Dashboard/`/admin/projekte/[id]`
- Design an awgit.at angelehnt: große abgerundete Karten (`--card`) statt
  dünner Rahmen, dunkle Pill-Eingabefelder (`--field`) statt weißer
  Formularfelder, durchgängig `rounded-full` bei Buttons/Inputs, hellere/
  größere Überschriften. Farb-Tokens liegen in `globals.css`

## Deployment
Sobald es lokal läuft: Projekt auf GitHub pushen, dann auf vercel.com importieren
und die gleichen Umgebungsvariablen dort eintragen.
