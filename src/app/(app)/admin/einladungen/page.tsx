'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_LABELS, ROLE_LABELS } from '@/lib/labels'

type ProjectOption = {
  id: string
  service_type: string
  companies: { name: string } | { name: string }[]
}

type InvitationRow = {
  id: string
  email: string
  role: string
  status: string
  token: string
  expires_at: string
  projects: { service_type: string; companies: { name: string } | { name: string }[] } | { service_type: string; companies: { name: string } | { name: string }[] }[] | null
}

const ROLES = [
  { value: 'geschaeftsfuehrer', label: 'Geschäftsführer' },
  { value: 'inhaber', label: 'Inhaber' },
  { value: 'marketingabteilung', label: 'Marketingabteilung' },
  { value: 'ansprechperson', label: 'Ansprechperson' },
]

const STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  angenommen: 'Angenommen',
  abgelaufen: 'Abgelaufen',
}

function projectLabel(projects: InvitationRow['projects']): string {
  const p = Array.isArray(projects) ? projects[0] : projects
  if (!p) return 'AWG-Team'
  const companyName = Array.isArray(p.companies) ? p.companies[0]?.name : p.companies?.name
  return `${companyName} — ${SERVICE_LABELS[p.service_type] ?? p.service_type}`
}

export default function AdminEinladungenPage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState('')
  const [role, setRole] = useState('ansprechperson')
  const [email, setEmail] = useState('')

  const [invitations, setInvitations] = useState<InvitationRow[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadInvitations = useCallback(() => {
    supabase
      .from('invitations')
      .select('id, email, role, status, token, expires_at, projects(service_type, companies(name))')
      .order('created_at', { ascending: false })
      .then(({ data }) => setInvitations((data as InvitationRow[]) ?? []))
  }, [supabase])

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, service_type, companies(name)')
      .then(({ data }) => setProjects((data as ProjectOption[]) ?? []))
    loadInvitations()
  }, [supabase, loadInvitations])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: projectRow } = await supabase.from('projects').select('company_id').eq('id', projectId).single()

    if (!projectRow) {
      setLoading(false)
      setError('Projekt konnte nicht gefunden werden.')
      return
    }

    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({ email, company_id: projectRow.company_id, project_id: projectId, role })

    setLoading(false)

    if (inviteError) {
      setError('Einladung konnte nicht angelegt werden.')
      return
    }

    setEmail('')
    loadInvitations()
  }

  async function handleCopy(id: string, token: string) {
    const link = `${window.location.origin}/einladung/${token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000)
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
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white transition active:scale-95 active:brightness-90 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'Wird erstellt...' : 'Einladungslink erstellen'}
        </button>
      </form>

      <h2 className="mb-3 mt-10 font-medium">Bisherige Einladungen</h2>
      {invitations.length === 0 ? (
        <p className="text-sm text-white/60">Noch keine Einladungen erstellt.</p>
      ) : (
        <ul className="space-y-2">
          {invitations.map((inv) => {
            const isExpired = inv.status === 'offen' && new Date(inv.expires_at) < new Date()
            const effectiveStatus = isExpired ? 'abgelaufen' : inv.status
            const isOpen = inv.status === 'offen' && !isExpired

            return (
              <li key={inv.id} className="rounded-2xl bg-[var(--card)] p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-white/60">
                      {projectLabel(inv.projects)} · {ROLE_LABELS[inv.role] ?? inv.role}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      effectiveStatus === 'offen'
                        ? 'bg-amber-400/20 text-amber-300'
                        : effectiveStatus === 'angenommen'
                          ? 'bg-emerald-400/20 text-emerald-300'
                          : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                  </span>
                </div>

                {isOpen && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(inv.id, inv.token)}
                      className="rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium transition active:scale-95 active:brightness-90"
                    >
                      {copiedId === inv.id ? 'Kopiert!' : 'Link kopieren'}
                    </button>
                    <p className="text-xs text-white/50">
                      Läuft ab am {new Date(inv.expires_at).toLocaleDateString('de-AT')}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
