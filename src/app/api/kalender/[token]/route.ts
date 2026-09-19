import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildIcs, type IcsEvent } from '@/lib/ics'
import { SERVICE_LABELS } from '@/lib/labels'

type Rel<T> = T | T[] | null | undefined

function one<T>(rel: Rel<T>): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function projectLabel(projects: Rel<{ service_type: string; companies: Rel<{ name: string }> }>) {
  const p = one(projects)
  const company = one(p?.companies)
  const service = p ? (SERVICE_LABELS[p.service_type] ?? p.service_type) : ''
  return [company?.name, service].filter(Boolean).join(' — ')
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: tokenRow } = await supabase
    .from('calendar_feed_tokens')
    .select('user_id')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { data: roleRows } = await supabase
    .from('user_project_roles')
    .select('role')
    .eq('user_id', tokenRow.user_id)

  const isStaff = roleRows?.some((r) => r.role === 'awg_admin' || r.role === 'awg_team')
  if (!isStaff) {
    return new NextResponse('Not found', { status: 404 })
  }

  const [{ data: deadlineRows }, { data: entryRows }, { data: meetingRows }] = await Promise.all([
    supabase.from('deadlines').select('id, title, due_date, projects(service_type, companies(name))'),
    supabase
      .from('calendar_entries')
      .select('id, title, scheduled_at, projects(service_type, companies(name))'),
    supabase
      .from('meetings')
      .select('id, title, meeting_date, notes, projects(service_type, companies(name))'),
  ])

  const events: IcsEvent[] = [
    ...(deadlineRows ?? []).map((d) => ({
      uid: `deadline-${d.id}@awg`,
      start: new Date(d.due_date),
      allDay: true,
      summary: `Deadline: ${d.title}`,
      description: projectLabel(d.projects),
    })),
    ...(entryRows ?? []).map((e) => ({
      uid: `termin-${e.id}@awg`,
      start: new Date(e.scheduled_at),
      summary: `Termin: ${e.title}`,
      description: projectLabel(e.projects),
    })),
    ...(meetingRows ?? []).map((m) => ({
      uid: `meeting-${m.id}@awg`,
      start: new Date(m.meeting_date),
      summary: `Meeting: ${m.title}`,
      description: [projectLabel(m.projects), m.notes].filter(Boolean).join('\n'),
    })),
  ]

  const ics = buildIcs('AWG Kalender', events)

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
