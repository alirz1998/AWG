'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminKalenderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [title, setTitle] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [notes, setNotes] = useState('')
  const [projectId, setProjectId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [existingFileViewUrl, setExistingFileViewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('calendar_entries')
      .select('title, scheduled_at, notes, file_url, project_id, projects(companies(name))')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (!data) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setTitle(data.title)
        const d = new Date(data.scheduled_at)
        setScheduledDate(d.toISOString().slice(0, 10))
        setScheduledTime(d.toTimeString().slice(0, 5))
        setNotes(data.notes ?? '')
        setProjectId(data.project_id)
        setExistingFileUrl(data.file_url)
        const p = Array.isArray(data.projects) ? data.projects[0] : data.projects
        const c = p ? (Array.isArray(p.companies) ? p.companies[0] : p.companies) : null
        setCompanyName(c?.name ?? '')

        if (data.file_url) {
          const { data: signed } = await supabase.storage.from('documents').createSignedUrl(data.file_url, 60 * 60)
          setExistingFileViewUrl(signed?.signedUrl ?? null)
        }
        setLoading(false)
      })
  }, [id, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    let fileUrl = existingFileUrl
    if (file) {
      const path = `${projectId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file)
      if (uploadError) {
        setSaving(false)
        setError('Dokument konnte nicht hochgeladen werden.')
        return
      }
      fileUrl = path
    }

    const { error: updateError } = await supabase
      .from('calendar_entries')
      .update({
        title,
        scheduled_at: new Date(`${scheduledDate}T${scheduledTime || '00:00'}`).toISOString(),
        notes: notes || null,
        file_url: fileUrl,
      })
      .eq('id', id)

    setSaving(false)

    if (updateError) {
      setError(`Termin konnte nicht gespeichert werden (${updateError.message}).`)
      return
    }

    if (fileUrl && fileUrl !== existingFileUrl) {
      setExistingFileUrl(fileUrl)
      const { data: signed } = await supabase.storage.from('documents').createSignedUrl(fileUrl, 60 * 60)
      setExistingFileViewUrl(signed?.signedUrl ?? null)
    }
    setFile(null)
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
        <p className="mt-4 text-sm text-white/60">Termin nicht gefunden.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/admin/termine" className="text-sm text-white/60 underline">
        ← Zurück zum Kalender
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Termin bearbeiten</h1>
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
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-3 py-3 text-sm text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Uhrzeit</label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-3 py-3 text-sm text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Notiz</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Dokument</label>
          {existingFileViewUrl && (
            <a
              href={existingFileViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 mb-2 inline-block rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
            >
              Aktuelles Dokument ansehen
            </a>
          )}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
          <p className="mt-1 text-xs text-white/50">Eine neue Datei ersetzt das aktuelle Dokument.</p>
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
