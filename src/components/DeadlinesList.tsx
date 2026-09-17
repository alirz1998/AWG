import type { Deadline } from '@/lib/project-overview'

export default function DeadlinesList({ deadlines }: { deadlines: Deadline[] }) {
  if (deadlines.length === 0) {
    return <p className="text-sm text-white/60">Noch keine Deadline hinterlegt.</p>
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = deadlines.filter((d) => d.due_date >= today)
  const past = deadlines
    .filter((d) => d.due_date < today)
    .sort((a, b) => (a.due_date < b.due_date ? 1 : -1))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-white/70">Anstehend</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-white/60">Keine anstehende Deadline.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm"
              >
                <p className="font-medium">{d.title}</p>
                <p className="text-white/70">{new Date(d.due_date).toLocaleDateString('de-AT')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-white/70">Vergangen</h3>
          <ul className="space-y-2">
            {past.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[var(--surface)]/50 p-3 text-sm text-white/50"
              >
                <p className="font-medium">{d.title}</p>
                <p>{new Date(d.due_date).toLocaleDateString('de-AT')}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
