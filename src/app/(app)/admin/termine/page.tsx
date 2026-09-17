import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUpcomingEvents, type CalendarEventType } from '@/lib/calendar-overview'

const TYPE_LABELS: Record<CalendarEventType, string> = {
  deadline: 'Deadline',
  termin: 'Drehtermin',
  meeting: 'Meeting',
}

const TYPE_STYLES: Record<CalendarEventType, string> = {
  deadline: 'bg-sky-400/20 text-sky-300',
  termin: 'bg-emerald-400/20 text-emerald-300',
  meeting: 'bg-violet-400/20 text-violet-300',
}

export default async function AdminTerminePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const events = await getUpcomingEvents(supabase)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Kalender</h1>
      <p className="mb-6 text-sm text-white/60">
        Alle anstehenden Deadlines, Drehtermine und Meetings über alle Kunden hinweg.
      </p>

      {events.length === 0 ? (
        <p className="text-sm text-white/60">Nichts Anstehendes.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => {
            const isDeadline = event.type === 'deadline'
            const dateLabel = isDeadline
              ? new Date(event.date).toLocaleDateString('de-AT')
              : new Date(event.date).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })

            return (
              <li key={`${event.type}-${event.id}`}>
                <Link
                  href={`/admin/projekte/${event.projectId}`}
                  className="block rounded-2xl bg-[var(--card)] p-4 text-sm transition active:scale-[0.98] hover:brightness-110 active:brightness-95"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_STYLES[event.type]}`}>
                      {TYPE_LABELS[event.type]}
                    </span>
                    <span className="text-white/70">{dateLabel}</span>
                  </div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-white/60">
                    {event.company} — {event.service}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
