'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_LABELS } from '@/lib/labels'
import { hasCalendar } from '@/lib/project-features'

type ProjectOption = {
  id: string
  service_type: string
  companies: { name: string } | { name: string }[]
}

export default function AdminKalenderPage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, service_type, companies(name)')
      .then(({ data }) => setProjects(((data as ProjectOption[]) ?? []).filter((p) => hasCalendar(p.service_type))))
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: insertError } = await supabase.from('calendar_entries').insert({
      project_id: projectId,
      title,
      scheduled_at: new Date(scheduledAt).toISOString(),
      notes: notes || null,
    })

    setLoading(false)

    if (insertError) {
      setError('Termin konnte nicht gespeichert werden.')
      return
    }

    setSuccess(true)
    setTitle('')
    setScheduledAt('')
    setNotes('')
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-light">Termin hinzufügen</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Projekt</label>
          <select
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          >
            <option value="">Bitte wählen...</option>
            {projects.map((p) => {
              const companyName = Array.isArray(p.companies) ? p.companies[0]?.name : p.companies?.name
              return (
                <option key={p.id} value={p.id}>
                  {companyName} — {SERVICE_LABELS[p.service_type] ?? p.service_type}
                </option>
              )
            })}
          </select>
          {projects.length === 0 && (
            <p className="mt-1 text-xs text-white/50">
              Keine Projekte mit Kalender (Social Media, Foto &amp; Video) gefunden.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Titel</label>
          <input
            type="text"
            required
            placeholder="z. B. Drehtermin, Content-Shooting"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Datum &amp; Uhrzeit</label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Notiz (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">Gespeichert!</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white transition active:scale-95 active:brightness-90 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
