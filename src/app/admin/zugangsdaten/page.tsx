'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProjectOption = {
  id: string
  service_type: string
  companies: { name: string } | { name: string }[]
}

export default function AdminZugangsdatenPage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [platformName, setPlatformName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [notes, setNotes] = useState('')

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

    // Zugangsdaten werden verschlüsselt gespeichert, über eine sichere
    // Datenbank-Funktion (die Passwörter nie im Klartext ablegt).
    const { error: insertError } = await supabase.rpc('add_credential', {
      p_project_id: projectId,
      p_platform_name: platformName,
      p_login: login,
      p_password: password,
      p_notes: notes,
    })

    setLoading(false)

    if (insertError) {
      setError('Zugangsdaten konnten nicht gespeichert werden.')
      return
    }

    setSuccess(true)
    setPlatformName('')
    setLogin('')
    setPassword('')
    setNotes('')
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Zugangsdaten hinterlegen</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Projekt</label>
          <select
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
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
          <label className="block text-sm font-medium">Plattform</label>
          <input
            type="text"
            required
            placeholder="z. B. Metricool"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Login / E-Mail</label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Passwort</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Notiz (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">Gespeichert!</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-900 px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
