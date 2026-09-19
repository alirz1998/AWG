import { hasDeadlines, hasCalendar } from '@/lib/project-features'

export type NavItem = {
  label: string
  href: string
  description: string
  group?: string
}

export const STAFF_NAV_ITEMS: NavItem[] = [
  {
    label: 'Kunde hinzufügen',
    href: '/admin/kunden/neu',
    description: 'Eine neue Firma als Kunde anlegen',
    group: 'Kunden & Projekte',
  },
  {
    label: 'Projekt hinzufügen',
    href: '/admin/projekte/neu',
    description: 'Ein neues Projekt für einen bestehenden Kunden anlegen',
    group: 'Kunden & Projekte',
  },
  {
    label: 'Person einladen',
    href: '/admin/einladungen',
    description: 'Eine neue Person zu einem bestehenden Projekt einladen',
    group: 'Kunden & Projekte',
  },
  {
    label: 'Kunden ansehen',
    href: '/admin/kunden',
    description: 'Liste aller Kunden ansehen oder bearbeiten',
    group: 'Kunden & Projekte',
  },
  {
    label: 'Projekte ansehen',
    href: '/admin/projekte',
    description: 'Liste aller Projekte ansehen oder bearbeiten',
    group: 'Kunden & Projekte',
  },
  {
    label: 'Kalender',
    href: '/admin/termine',
    description: 'Alle anstehenden Deadlines, Drehtermine und Meetings über alle Kunden hinweg ansehen',
    group: 'Kunden & Projekte',
  },
  {
    label: 'Kalender abonnieren',
    href: '/kalender-abo',
    description: 'Deadlines, Termine und Meetings automatisch in deinem eigenen Kalender (z. B. Apple Kalender) anzeigen lassen',
    group: 'Kunden & Projekte',
  },
  {
    label: 'Team-Mitglied einladen',
    href: '/admin/team',
    description: 'Ein neues AWG-Team-Mitglied einladen',
    group: 'Team',
  },
  {
    label: 'Rechnung hochladen',
    href: '/admin/buchhaltung',
    description: 'Eine Rechnung scannen und nach Monat abgelegt an die Buchhaltung übergeben',
    group: 'Buchhaltung',
  },
]

export function getClientNavItems(projectId: string, serviceType: string): NavItem[] {
  const items: NavItem[] = [
    {
      label: 'Zielgruppenanalyse ausfüllen',
      href: `/fragebogen?project=${projectId}`,
      description: 'Den Fragebogen zur Zielgruppenanalyse ausfüllen oder bearbeiten',
    },
    {
      label: 'Projektübersicht ansehen',
      href: `/projekt?project=${projectId}`,
      description: 'Zugangsdaten, Dokumente, Links und Antworten des Projekts ansehen',
    },
    {
      label: 'Zugangsdaten ansehen',
      href: `/projekt/zugangsdaten?project=${projectId}`,
      description: 'Zugangsdaten für dieses Projekt ansehen',
    },
    {
      label: 'Meetings ansehen',
      href: `/projekt/meetings?project=${projectId}`,
      description: 'Meeting-Notizen und Termine für dieses Projekt ansehen',
    },
    {
      label: 'Kalender abonnieren',
      href: '/kalender-abo',
      description: 'Termine, Deadlines und Meetings für dein Projekt automatisch in deinem eigenen Kalender (z. B. Apple Kalender) anzeigen lassen',
    },
  ]

  if (hasDeadlines(serviceType)) {
    items.push({
      label: 'Deadlines ansehen',
      href: `/projekt/deadlines?project=${projectId}`,
      description: 'Anstehende Deadlines für dieses Projekt ansehen',
    })
  }

  if (hasCalendar(serviceType)) {
    items.push({
      label: 'Termine ansehen',
      href: `/projekt/kalender?project=${projectId}`,
      description: 'Anstehende Dreh-/Content-Termine ansehen',
    })
  }

  return items
}
