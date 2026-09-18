import Link from 'next/link'
import type { Meeting } from '@/lib/project-overview'

type MeetingWithProject = Meeting & { projectLabel?: string }

const LONG_NOTES_THRESHOLD = 160

function MeetingNotes({ notes, className }: { notes: string; className?: string }) {
  if (notes.length <= LONG_NOTES_THRESHOLD) {
    return <p className={`mt-1 whitespace-pre-wrap ${className ?? ''}`}>{notes}</p>
  }

  return (
    <details className="group mt-1">
      <summary className={`cursor-pointer list-none marker:content-none ${className ?? ''}`}>
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
        Notizen anzeigen
      </summary>
      <p className={`mt-1 whitespace-pre-wrap ${className ?? ''}`}>{notes}</p>
    </details>
  )
}

export default function MeetingsList({ meetings, editable }: { meetings: MeetingWithProject[]; editable?: boolean }) {
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
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{m.title}</p>
                  <p className="shrink-0 text-white/70">
                    {new Date(m.meeting_date).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {m.projectLabel && <p className="text-white/60">{m.projectLabel}</p>}
                {m.notes && <MeetingNotes notes={m.notes} className="text-white/60" />}
                {editable && (
                  <Link
                    href={`/admin/meetings/${m.id}`}
                    className="mt-2 inline-block rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium transition active:scale-95"
                  >
                    Bearbeiten
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <details className="group">
          <summary className="mb-2 cursor-pointer list-none text-sm font-medium text-white/70 marker:content-none">
            <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
            Vergangen ({past.length})
          </summary>
          <ul className="space-y-2">
            {past.map((m) => (
              <li key={m.id} className="rounded-xl border border-white/10 bg-[var(--surface)]/50 p-3 text-sm text-white/50">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{m.title}</p>
                  <p className="shrink-0">
                    {new Date(m.meeting_date).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {m.projectLabel && <p>{m.projectLabel}</p>}
                {m.notes && <MeetingNotes notes={m.notes} />}
                {editable && (
                  <Link
                    href={`/admin/meetings/${m.id}`}
                    className="mt-2 inline-block rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white/70 transition active:scale-95"
                  >
                    Bearbeiten
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
