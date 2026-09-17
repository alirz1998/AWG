import type { CalendarEntry } from '@/lib/project-overview'

export default function CalendarEntriesList({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-white/60">Noch kein Termin geplant.</p>
  }

  const now = new Date().toISOString()
  const upcoming = entries.filter((e) => e.scheduled_at >= now)
  const past = entries.filter((e) => e.scheduled_at < now).sort((a, b) => (a.scheduled_at < b.scheduled_at ? 1 : -1))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-white/70">Anstehend</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-white/60">Kein anstehender Termin.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-white/70">
                    {new Date(e.scheduled_at).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {e.notes && <p className="mt-1 text-white/60">{e.notes}</p>}
                {e.viewUrl && (
                  <a
                    href={e.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
                  >
                    Dokument ansehen
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-white/70">Vergangen</h3>
          <ul className="space-y-2">
            {past.map((e) => (
              <li key={e.id} className="rounded-xl border border-white/10 bg-[var(--surface)]/50 p-3 text-sm text-white/50">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{e.title}</p>
                  <p>{new Date(e.scheduled_at).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                {e.notes && <p className="mt-1">{e.notes}</p>}
                {e.viewUrl && (
                  <a
                    href={e.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white/70"
                  >
                    Dokument ansehen
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
