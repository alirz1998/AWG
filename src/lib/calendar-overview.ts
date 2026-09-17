import type { createClient } from '@/lib/supabase/server'
import { SERVICE_LABELS } from '@/lib/labels'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type CalendarEventType = 'deadline' | 'termin' | 'meeting'

export type CalendarEvent = {
  id: string
  type: CalendarEventType
  date: string
  title: string
  notes: string | null
  projectId: string
  company: string
  service: string
}

type Rel<T> = T | T[] | null | undefined

function one<T>(rel: Rel<T>): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function projectInfo(projects: Rel<{ service_type: string; companies: Rel<{ name: string }> }>) {
  const p = one(projects)
  const company = one(p?.companies)
  return {
    service: p ? (SERVICE_LABELS[p.service_type] ?? p.service_type) : '',
    company: company?.name ?? '',
  }
}

// Alle anstehenden Deadlines, Termine und Meetings über alle Kunden hinweg,
// chronologisch sortiert. Für die staff-weite Kalender-Übersicht.
export async function getUpcomingEvents(supabase: SupabaseServerClient): Promise<CalendarEvent[]> {
  const nowDate = new Date().toISOString().slice(0, 10)
  const nowIso = new Date().toISOString()

  const [{ data: deadlineRows }, { data: entryRows }, { data: meetingRows }] = await Promise.all([
    supabase
      .from('deadlines')
      .select('id, title, due_date, project_id, projects(service_type, companies(name))')
      .gte('due_date', nowDate),
    supabase
      .from('calendar_entries')
      .select('id, title, scheduled_at, project_id, projects(service_type, companies(name))')
      .gte('scheduled_at', nowIso),
    supabase
      .from('meetings')
      .select('id, title, meeting_date, notes, project_id, projects(service_type, companies(name))')
      .gte('meeting_date', nowIso),
  ])

  const events: CalendarEvent[] = [
    ...(deadlineRows ?? []).map((d) => ({
      id: d.id,
      type: 'deadline' as const,
      date: d.due_date,
      title: d.title,
      notes: null,
      projectId: d.project_id,
      ...projectInfo(d.projects),
    })),
    ...(entryRows ?? []).map((e) => ({
      id: e.id,
      type: 'termin' as const,
      date: e.scheduled_at,
      title: e.title,
      notes: null,
      projectId: e.project_id,
      ...projectInfo(e.projects),
    })),
    ...(meetingRows ?? []).map((m) => ({
      id: m.id,
      type: 'meeting' as const,
      date: m.meeting_date,
      title: m.title,
      notes: m.notes,
      projectId: m.project_id,
      ...projectInfo(m.projects),
    })),
  ]

  return events.sort((a, b) => (a.date < b.date ? -1 : 1))
}

export function countEventsWithinDays(events: CalendarEvent[], days: number): number {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  return events.filter((e) => e.date <= cutoff).length
}
