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
2. In Supabase: SQL Editor öffnen, Inhalt von `supabase/schema.sql` einfügen und ausführen
3. `npm install`
4. `npm run dev`
5. Im Browser: http://localhost:3000/login

## Noch zu bauen (nächste Schritte im Projekt)
- API-Route `/api/invitations/accept`, die den Einladungs-Token prüft und den
  Nutzer automatisch dem richtigen Projekt zuweist
- Admin-Ansicht: neue Einladung erstellen (E-Mail, Firma, Rolle -> Link generieren)
- Dashboard-Ansicht für Kunden: Zugangsdaten, Fragebogen, Vertrag
- Dashboard-Ansicht für AWG-Team: projektübergreifende Sicht, TODOs

## Deployment
Sobald es lokal läuft: Projekt auf GitHub pushen, dann auf vercel.com importieren
und die gleichen Umgebungsvariablen dort eintragen.
