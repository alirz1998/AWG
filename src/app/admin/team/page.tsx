'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAFF_ROLES = [
  { value: 'awg_team', label: 'AWG Team' },
  { value: 'awg_admin', label: 'AWG Admin' },
]

export default function AdminTeamPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState(STAFF_ROLES[0].value)

  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInviteLink(null)

    // Team-Einladungen gehören zu keiner Firma/keinem Projekt.
    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .insert({ email, role })
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
      <h1 className="mb-6 text-xl font-semibold">Team-Mitglied einladen</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">E-Mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Rolle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-900 px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Wird erstellt...' : 'Einladungslink erstellen'}
        </button>
      </form>

      {inviteLink && (
        <div className="mt-6 rounded-md border border-green-400/30 bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-300">Einladungslink erstellt:</p>
          <p className="mt-1 break-all text-sm text-green-400">{inviteLink}</p>
        </div>
      )}
    </div>
  )
}
