'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const OPTIONS: { value: string; label: string }[] = [
  { value: 'aktiv', label: 'Laufend' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
]

export default function ProjectStatusToggle({
  projectId,
  status,
}: {
  projectId: string
  status: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bestehende Projekte können noch 'onboarding' aus der alten Vorbelegung
  // haben; das zählt für die Anzeige als 'aktiv' (Laufend).
  const current = status === 'abgeschlossen' ? 'abgeschlossen' : 'aktiv'

  async function handleChange(next: string) {
    if (next === current) return
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase.from('projects').update({ status: next }).eq('id', projectId)

    setSaving(false)

    if (updateError) {
      setError(`Status konnte nicht geändert werden (${updateError.message}).`)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <div className="inline-flex rounded-full bg-[var(--field)] p-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => handleChange(o.value)}
            disabled={saving}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              current === o.value ? 'bg-white text-black' : 'text-white/70'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
