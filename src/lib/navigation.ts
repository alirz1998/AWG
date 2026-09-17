export type NavItem = {
  label: string
  href: string
  description: string
}

export const STAFF_NAV_ITEMS: NavItem[] = [
  {
    label: 'Kunde hinzufügen',
    href: '/admin/kunden/neu',
    description: 'Eine neue Firma als Kunde anlegen',
  },
  {
    label: 'Projekt hinzufügen',
    href: '/admin/projekte/neu',
    description: 'Ein neues Projekt für einen bestehenden Kunden anlegen',
  },
  {
    label: 'Person einladen',
    href: '/admin/einladungen',
    description: 'Eine neue Person zu einem bestehenden Projekt einladen',
  },
  {
    label: 'Kunden ansehen',
    href: '/admin/kunden',
    description: 'Liste aller Kunden ansehen oder bearbeiten',
  },
  {
    label: 'Projekte ansehen',
    href: '/admin/projekte',
    description: 'Liste aller Projekte ansehen oder bearbeiten',
  },
  {
    label: 'Team-Mitglied einladen',
    href: '/admin/team',
    description: 'Ein neues AWG-Team-Mitglied einladen',
  },
  {
    label: 'Zugangsdaten hinterlegen',
    href: '/admin/zugangsdaten',
    description: 'Zugangsdaten für einen Kunden hinterlegen',
  },
  {
    label: 'Dokument hochladen',
    href: '/admin/dokumente',
    description: 'Ein Angebot, Vertrag oder sonstiges Dokument hochladen',
  },
  {
    label: 'Link hinzufügen',
    href: '/admin/links',
    description: 'Einen Link für einen Kunden hinzufügen',
  },
]

export function getClientNavItems(projectId: string): NavItem[] {
  return [
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
  ]
}
