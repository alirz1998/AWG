import type { Meeting } from '@/lib/project-overview'

export default function MeetingsList({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return <p className="text-sm text-white/60">Noch kein Meeting hinterlegt.</p>
  }

  const now = new Date().toISOString()
  const upcoming = meetings.filter((m) => m.meeting_date >= now)
  const past = meetings.filter((m) => m.meeting_date < now).sort((a, b) => (a.meeting_date < b.meeting_date ? 1 : -1))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-white/70">Anstehend</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-white/60">Kein anstehendes Meeting.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((m) => (
              <li key={m.id} className="rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-white/70">
                    {new Date(m.meeting_date).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {m.notes && <p className="mt-1 text-white/60">{m.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-white/70">Vergangen</h3>
          <ul className="space-y-2">
            {past.map((m) => (
              <li key={m.id} className="rounded-xl border border-white/10 bg-[var(--surface)]/50 p-3 text-sm text-white/50">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.title}</p>
                  <p>{new Date(m.meeting_date).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                {m.notes && <p className="mt-1">{m.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
