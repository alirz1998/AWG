'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Company = { id: string; name: string }

const ROLES = [
  { value: 'geschaeftsfuehrer', label: 'Geschäftsführer' },
  { value: 'inhaber', label: 'Inhaber' },
  { value: 'marketingabteilung', label: 'Marketingabteilung' },
  { value: 'ansprechperson', label: 'Ansprechperson' },
]

const SERVICE_TYPES = [
  { value: 'social_media', label: 'Social Media Betreuung' },
  { value: 'webdesign', label: 'Webdesign' },
  { value: 'druckprodukte', label: 'Druckprodukte' },
  { value: 'grafikdesign', label: 'Grafikdesign' },
  { value: 'foto_video', label: 'Foto & Video' },
]

export default function AdminEinladungenPage() {
  const supabase = createClient()

  const [companies, setCompanies] = useState<Company[]>([])
  const [companyMode, setCompanyMode] = useState<'existing' | 'new'>('new')
  const [companyId, setCompanyId] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newKundennummer, setNewKundennummer] = useState('')

  const [serviceType, setServiceType] = useState('social_media')
  const [role, setRole] = useState('ansprechperson')
  const [email, setEmail] = useState('')

  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('companies')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCompanies(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInviteLink(null)

    try {
      let finalCompanyId = companyId

      // Neue Firma anlegen, falls gewählt
      if (companyMode === 'new') {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({ name: newCompanyName, kundennummer: newKundennummer || null })
          .select('id')
          .single()

        if (companyError || !newCompany) throw new Error('Firma konnte nicht angelegt werden.')
        finalCompanyId = newCompany.id
      }

      // Neues Projekt für diese Firma anlegen
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({ company_id: finalCompanyId, service_type: serviceType })
        .select('id')
        .single()

      if (projectError || !newProject) throw new Error('Projekt konnte nicht angelegt werden.')

      // Einladung anlegen
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email,
          company_id: finalCompanyId,
          project_id: newProject.id,
          role,
        })
        .select('token')
        .single()

      if (inviteError || !invite) throw new Error('Einladung konnte nicht angelegt werden.')

      setInviteLink(`${window.location.origin}/einladung/${invite.token}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-light">Neuen Kunden einladen</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Firma</label>
          <div className="mt-1 flex gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={companyMode === 'new'}
                onChange={() => setCompanyMode('new')}
              />
              Neue Firma
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={companyMode === 'existing'}
                onChange={() => setCompanyMode('existing')}
              />
              Bestehende Firma
            </label>
          </div>

          {companyMode === 'new' ? (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                required
                placeholder="Firmenname"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
              />
              <input
                type="text"
                placeholder="Kundennummer (optional)"
                value={newKundennummer}
                onChange={(e) => setNewKundennummer(e.target.value)}
                className="w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
              />
            </div>
          ) : (
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="mt-2 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
            >
              <option value="">Bitte wählen...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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

        <div>
          <label className="block text-sm font-medium">Rolle des Kunden</label>
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
          <label className="block text-sm font-medium">E-Mail des Kunden</label>
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
