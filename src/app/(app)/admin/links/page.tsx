'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ProjectOption = {
  id: string
  service_type: string
  companies: { name: string } | { name: string }[]
}

function LinksForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState(searchParams.get('project') ?? '')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, service_type, companies(name)')
      .then(({ data }) => setProjects((data as ProjectOption[]) ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: insertError } = await supabase.from('links').insert({
      project_id: projectId,
      title,
      url,
    })

    setLoading(false)

    if (insertError) {
      setError('Link konnte nicht gespeichert werden.')
      return
    }

    setSuccess(true)
    setTitle('')
    setUrl('')
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-light">Link hinzufügen</h1>

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
              const companyName = Array.isArray(p.companies)
                ? p.companies[0]?.name
                : p.companies?.name
              return (
                <option key={p.id} value={p.id}>
                  {companyName} — {p.service_type}
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
            placeholder="z. B. Geteilter Drive-Ordner, Formular"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">URL</label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
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

export default function AdminLinksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg p-8">
          <p className="text-sm text-white/60">Lädt...</p>
        </div>
      }
    >
      <LinksForm />
    </Suspense>
  )
}
