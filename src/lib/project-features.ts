// Nicht jedes Projekt braucht dieselben Funktionen: Deadlines passen zu
// Projekten mit einem klaren Liefertermin, ein Termin-Kalender passt zu
// Projekten mit wiederkehrenden Content-/Drehterminen.

export const DEADLINE_SERVICE_TYPES = ['webdesign', 'druckprodukte', 'grafikdesign']
export const CALENDAR_SERVICE_TYPES = ['social_media', 'foto_video']

export function hasDeadlines(serviceType: string): boolean {
  return DEADLINE_SERVICE_TYPES.includes(serviceType)
}

export function hasCalendar(serviceType: string): boolean {
  return CALENDAR_SERVICE_TYPES.includes(serviceType)
}
