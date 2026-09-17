'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProjectOption = {
  id: string
  service_type: string
  companies: { name: string } | { name: string }[]
}

const DOC_TYPES = [
  { value: 'angebot', label: 'Angebot' },
  { value: 'vertrag', label: 'Vertrag' },
  { value: 'rechnung', label: 'Rechnung' },
  { value: 'dokument', label: 'Sonstiges Dokument' },
]

export default function AdminDokumentePage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [docType, setDocType] = useState(DOC_TYPES[0].value)
  const [file, setFile] = useState<File | null>(null)

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
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    // Dateipfad beginnt mit der Projekt-ID, damit Storage-Policies
    // pro Projekt entscheiden können, wer die Datei sehen darf.
    const path = `${projectId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file)

    if (uploadError) {
      setLoading(false)
      setError('Datei konnte nicht hochgeladen werden.')
      return
    }

    const { error: insertError } = await supabase.from('documents').insert({
      project_id: projectId,
      doc_type: docType,
      file_url: path,
    })

    setLoading(false)

    if (insertError) {
      setError('Datei wurde hochgeladen, aber der Eintrag konnte nicht gespeichert werden.')
      return
    }

    setSuccess(true)
    setFile(null)
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Dokument hochladen</h1>

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
          <label className="block text-sm font-medium">Art des Dokuments</label>
          <select
            required
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Datei</label>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">Hochgeladen!</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-900 px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Wird hochgeladen...' : 'Hochladen'}
        </button>
      </form>
    </div>
  )
}
