'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminMeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [notes, setNotes] = useState('')
  const [companyName, setCompanyName] = useState('')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('meetings')
      .select('title, meeting_date, notes, projects(companies(name))')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setTitle(data.title)
        const d = new Date(data.meeting_date)
        setMeetingDate(d.toISOString().slice(0, 10))
        setMeetingTime(d.toTimeString().slice(0, 5))
        setNotes(data.notes ?? '')
        const p = Array.isArray(data.projects) ? data.projects[0] : data.projects
        const c = p ? (Array.isArray(p.companies) ? p.companies[0] : p.companies) : null
        setCompanyName(c?.name ?? '')
        setLoading(false)
      })
  }, [id, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        title,
        meeting_date: new Date(`${meetingDate}T${meetingTime || '00:00'}`).toISOString(),
        notes: notes || null,
      })
      .eq('id', id)

    setSaving(false)

    if (updateError) {
      setError(`Meeting konnte nicht gespeichert werden (${updateError.message}).`)
      return
    }

    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-sm text-white/60">Lädt...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Link href="/admin/termine" className="text-sm text-white/60 underline">
          ← Zurück zum Kalender
        </Link>
        <p className="mt-4 text-sm text-white/60">Meeting nicht gefunden.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/admin/termine" className="text-sm text-white/60 underline">
        ← Zurück zum Kalender
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Meeting bearbeiten</h1>
      {companyName && <p className="mb-6 text-sm text-white/60">{companyName}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Titel</label>
          <input
            type="text"
            required
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
          <label className="block text-sm font-medium">Notizen</label>
          <textarea
            rows={6}
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
          disabled={saving}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white transition active:scale-95 active:brightness-90 disabled:opacity-50 disabled:active:scale-100"
        >
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
