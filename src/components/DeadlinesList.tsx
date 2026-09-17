import type { Deadline } from '@/lib/project-overview'

export default function DeadlinesList({ deadlines }: { deadlines: Deadline[] }) {
  if (deadlines.length === 0) {
    return <p className="text-sm text-white/60">Noch keine Deadline hinterlegt.</p>
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <ul className="space-y-2">
      {deadlines.map((d) => {
        const overdue = d.due_date < today
        return (
          <li
            key={d.id}
            className={`flex items-center justify-between rounded-xl border p-3 text-sm ${
              overdue ? 'border-red-400/30 bg-red-500/10' : 'border-white/10 bg-black/10'
            }`}
          >
            <p className="font-medium">{d.title}</p>
            <p className={overdue ? 'text-red-300' : 'text-white/70'}>
              {new Date(d.due_date).toLocaleDateString('de-AT')}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
