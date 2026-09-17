'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminKundeNeuPage() {
  const supabase = createClient()
  const router = useRouter()

  const [name, setName] = useState('')
  const [branche, setBranche] = useState('')
  const [kundennummer, setKundennummer] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: company, error: insertError } = await supabase
      .from('companies')
      .insert({ name, branche: branche || null, kundennummer: kundennummer || null })
      .select('id')
      .single()

    setLoading(false)

    if (insertError || !company) {
      setError('Kunde konnte nicht angelegt werden.')
      return
    }

    router.push(`/admin/kunden/${company.id}`)
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/admin/kunden" className="text-sm text-white/60 underline">
        ← Zurück zu Kunden
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Kunde hinzufügen</h1>
      <p className="mb-6 text-sm text-white/60">
        Legt nur die Firma an. Ein Projekt (und die Einladung der ersten Person) kommt im
        nächsten Schritt dazu.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Firmenname</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Branche (optional)</label>
          <input
            type="text"
            value={branche}
            onChange={(e) => setBranche(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Kundennummer (optional)</label>
          <input
            type="text"
            value={kundennummer}
            onChange={(e) => setKundennummer(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Wird angelegt...' : 'Kunde anlegen'}
        </button>
      </form>
    </div>
  )
}
