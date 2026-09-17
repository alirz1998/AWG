'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_LABELS } from '@/lib/labels'

type ProjectOption = {
  id: string
  service_type: string
  companies: { name: string } | { name: string }[]
}

const ROLES = [
  { value: 'geschaeftsfuehrer', label: 'Geschäftsführer' },
  { value: 'inhaber', label: 'Inhaber' },
  { value: 'marketingabteilung', label: 'Marketingabteilung' },
  { value: 'ansprechperson', label: 'Ansprechperson' },
]

export default function AdminEinladungenPage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [role, setRole] = useState('ansprechperson')
  const [email, setEmail] = useState('')

  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, service_type, companies(name)')
      .then(({ data }) => setProjects((data as ProjectOption[]) ?? []))
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInviteLink(null)

    const { data: projectRow } = await supabase.from('projects').select('company_id').eq('id', projectId).single()

    if (!projectRow) {
      setLoading(false)
      setError('Projekt konnte nicht gefunden werden.')
      return
    }

    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .insert({ email, company_id: projectRow.company_id, project_id: projectId, role })
      .select('token')
      .single()

    setLoading(false)

    if (inviteError || !invite) {
      setError('Einladung konnte nicht angelegt werden.')
      return
    }

    setInviteLink(`${window.location.origin}/einladung/${invite.token}`)
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Person einladen</h1>
      <p className="mb-6 text-sm text-white/60">
        Lädt eine neue Person zu einem bestehenden Projekt ein. Für einen komplett neuen Kunden
        oder ein neues Projekt: siehe „Kunde hinzufügen“ bzw. „Projekt hinzufügen“ im Menü.
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
          <label className="block text-sm font-medium">Rolle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">E-Mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Wird erstellt...' : 'Einladungslink erstellen'}
        </button>
      </form>

      {inviteLink && (
        <div className="mt-6 rounded-2xl border border-green-400/30 bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-300">Einladungslink erstellt:</p>
          <p className="mt-1 break-all text-sm text-green-400">{inviteLink}</p>
        </div>
      )}
    </div>
  )
}
