import type { CalendarEntry } from '@/lib/project-overview'

export default function CalendarEntriesList({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-white/60">Noch kein Termin geplant.</p>
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li key={e.id} className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">{e.title}</p>
            <p className="text-white/70">
              {new Date(e.scheduled_at).toLocaleString('de-AT', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          {e.notes && <p className="mt-1 text-white/60">{e.notes}</p>}
        </li>
      ))}
    </ul>
  )
}
