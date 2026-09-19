export type IcsEvent = {
  uid: string
  start: Date
  end?: Date
  allDay?: boolean
  summary: string
  description?: string
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

function formatDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

export function buildIcs(calendarName: string, events: IcsEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AWG//Kalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]

  const now = formatDateTime(new Date())

  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.uid}`)
    lines.push(`DTSTAMP:${now}`)

    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatDate(event.start)}`)
    } else {
      lines.push(`DTSTART:${formatDateTime(event.start)}`)
      if (event.end) {
        lines.push(`DTEND:${formatDateTime(event.end)}`)
      }
    }

    lines.push(`SUMMARY:${escapeText(event.summary)}`)
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
