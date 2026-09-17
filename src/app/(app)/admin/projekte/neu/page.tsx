'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_LABELS } from '@/lib/labels'

type Company = { id: string; name: string }

const SERVICE_TYPES = Object.entries(SERVICE_LABELS).map(([value, label]) => ({ value, label }))

const ROLES = [
  { value: 'geschaeftsfuehrer', label: 'Geschäftsführer' },
  { value: 'inhaber', label: 'Inhaber' },
  { value: 'marketingabteilung', label: 'Marketingabteilung' },
  { value: 'ansprechperson', label: 'Ansprechperson' },
]

function ProjektNeuForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [companies, setCompanies] = useState<Company[]>([])
  const [companyId, setCompanyId] = useState(searchParams.get('company') ?? '')
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0].value)

  const [inviteNewPerson, setInviteNewPerson] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('ansprechperson')

  const [existingPeopleCount, setExistingPeopleCount] = useState<number | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase
      .from('companies')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCompanies(data ?? []))
  }, [supabase])

  useEffect(() => {
    if (!companyId) return
    supabase
      .from('user_project_roles')
      .select('user_id, projects!inner(company_id)')
      .eq('projects.company_id', companyId)
      .then(({ data }) => {
        setExistingPeopleCount(new Set((data ?? []).map((r) => r.user_id)).size)
      })
  }, [companyId, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInviteLink(null)

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({ company_id: companyId, service_type: serviceType })
        .select('id')
        .single()

      if (projectError || !project) throw new Error('Projekt konnte nicht angelegt werden.')

      // Personen, die bereits Zugriff auf ein anderes Projekt dieses Kunden
      // haben, bekommen automatisch auch Zugriff auf das neue Projekt —
      // sie müssen sich dafür nicht erneut registrieren.
      const { data: existingRoles } = await supabase
        .from('user_project_roles')
        .select('user_id, role, projects!inner(company_id)')
        .eq('projects.company_id', companyId)

      const seen = new Set<string>()
      const grants = (existingRoles ?? [])
        .filter((r) => {
          if (seen.has(r.user_id)) return false
          seen.add(r.user_id)
          return true
        })
        .map((r) => ({ user_id: r.user_id, project_id: project.id, role: r.role }))

      if (grants.length > 0) {
        const { error: grantError } = await supabase.from('user_project_roles').insert(grants)
        if (grantError) throw new Error('Projekt wurde angelegt, aber bestehende Personen konnten nicht zugeordnet werden.')
      }

      if (inviteNewPerson && email) {
        const { data: invite, error: inviteError } = await supabase
          .from('invitations')
          .insert({ email, company_id: companyId, project_id: project.id, role })
          .select('token')
          .single()

        if (inviteError || !invite) throw new Error('Projekt wurde angelegt, aber die Einladung konnte nicht erstellt werden.')

        setInviteLink(`${window.location.origin}/einladung/${invite.token}`)
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/admin/projekte" className="text-sm text-white/60 underline">
        ← Zurück zu Projekten
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Projekt hinzufügen</h1>
      <p className="mb-6 text-sm text-white/60">
        Legt ein neues Projekt für einen bestehenden Kunden an. Personen, die schon Zugriff auf
        ein anderes Projekt dieses Kunden haben, sehen das neue Projekt automatisch in ihrem
        Dashboard.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Kunde</label>
          <select
            required
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          >
            <option value="">Bitte wählen...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {existingPeopleCount !== null && (
            <p className="mt-1 text-xs text-white/50">
              {existingPeopleCount > 0
                ? `${existingPeopleCount} Person(en) haben bereits Zugriff und bekommen das neue Projekt automatisch dazu.`
                : 'Noch niemand hat Zugriff auf diesen Kunden — lade unten ggf. die erste Person ein.'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Dienstleistung</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inviteNewPerson}
            onChange={(e) => setInviteNewPerson(e.target.checked)}
          />
          Zusätzlich eine neue Person für dieses Projekt einladen
        </label>

        {inviteNewPerson && (
          <div className="space-y-4 rounded-2xl bg-[var(--card)] p-4">
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
                required={inviteNewPerson}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white transition active:scale-95 active:brightness-90 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'Wird angelegt...' : 'Projekt anlegen'}
        </button>
      </form>

      {success && (
        <div className="mt-6 rounded-2xl border border-green-400/30 bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-300">Projekt wurde angelegt!</p>
          {inviteLink && (
            <>
              <p className="mt-2 text-sm text-green-300">Einladungslink für die neue Person:</p>
              <p className="mt-1 break-all text-sm text-green-400">{inviteLink}</p>
            </>
          )}
          <Link
            href={`/admin/kunden/${companyId}`}
            className="mt-3 inline-block text-sm text-green-300 underline"
          >
            Zum Kunden
          </Link>
        </div>
      )}
    </div>
  )
}

export default function AdminProjektNeuPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg p-8">
          <p className="text-sm text-white/60">Lädt...</p>
        </div>
      }
    >
      <ProjektNeuForm />
    </Suspense>
  )
}
