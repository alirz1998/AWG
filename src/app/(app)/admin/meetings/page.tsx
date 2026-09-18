'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_LABELS } from '@/lib/labels'
import MeetingsList from '@/components/MeetingsList'

type ProjectOption = {
  id: string
  service_type: string
  companies: { name: string } | { name: string }[]
}

type MeetingRow = {
  id: string
  title: string
  meeting_date: string
  notes: string | null
  projects: { service_type: string; companies: { name: string } | { name: string }[] } | { service_type: string; companies: { name: string } | { name: string }[] }[] | null
}

function projectLabel(projects: MeetingRow['projects']): string {
  const p = Array.isArray(projects) ? projects[0] : projects
  if (!p) return ''
  const companyName = Array.isArray(p.companies) ? p.companies[0]?.name : p.companies?.name
  return `${companyName} — ${SERVICE_LABELS[p.service_type] ?? p.service_type}`
}

function MeetingsForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState(searchParams.get('project') ?? '')
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [notes, setNotes] = useState('')

  const [allMeetings, setAllMeetings] = useState<MeetingRow[]>([])

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadMeetings = useCallback(() => {
    supabase
      .from('meetings')
      .select('id, title, meeting_date, notes, projects(service_type, companies(name))')
      .order('meeting_date', { ascending: true })
      .then(({ data }) => setAllMeetings((data as MeetingRow[]) ?? []))
  }, [supabase])

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, service_type, companies(name)')
      .then(({ data }) => setProjects((data as ProjectOption[]) ?? []))
    loadMeetings()
  }, [supabase, loadMeetings])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: insertError } = await supabase.from('meetings').insert({
      project_id: projectId,
      title,
      meeting_date: new Date(`${meetingDate}T${meetingTime || '00:00'}`).toISOString(),
      notes: notes || null,
    })

    setLoading(false)

    if (insertError) {
      setError(`Meeting konnte nicht gespeichert werden (${insertError.message}).`)
      return
    }

    setSuccess(true)
    setTitle('')
    setMeetingDate('')
    setMeetingTime('')
    setNotes('')
    loadMeetings()
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Meeting hinzufügen</h1>
      <p className="mb-6 text-sm text-white/60">
        Notizen und Termin eines Meetings, sichtbar für den Kunden im Projekt.
      </p>

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
        </div>

        <div>
          <label className="block text-sm font-medium">Titel</label>
          <input
            type="text"
            required
            placeholder="z. B. Kickoff-Meeting, Quartals-Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Datum</label>
            <input
              type="date"
              required
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-3 py-3 text-sm text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Uhrzeit</label>
            <input
              type="time"
              required
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-3 py-3 text-sm text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Notizen (optional)</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Was wurde besprochen?"
            className="mt-1 w-full rounded-3xl border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
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

      <h2 className="mb-3 mt-10 font-medium">Alle Meetings</h2>
      <MeetingsList
        meetings={allMeetings.map((m) => ({
          id: m.id,
          title: m.title,
          meeting_date: m.meeting_date,
          notes: m.notes,
          projectLabel: projectLabel(m.projects),
        }))}
        editable
      />
    </div>
  )
}

export default function AdminMeetingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg p-8">
          <p className="text-sm text-white/60">Lädt...</p>
        </div>
      }
    >
      <MeetingsForm />
    </Suspense>
  )
}
