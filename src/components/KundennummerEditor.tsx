'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function KundennummerEditor({
  companyId,
  initialValue,
}: {
  companyId: string
  initialValue: string | null
}) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue ?? '')
  const [saved, setSaved] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('companies')
      .update({ kundennummer: value || null })
      .eq('id', companyId)

    setSaving(false)

    if (updateError) {
      setError('Kundennummer konnte nicht gespeichert werden.')
      return
    }

    setSaved(value || null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-white/60 underline hover:text-white/90"
      >
        {saved ? `Kundennummer: ${saved}` : 'Kundennummer vergeben'}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="z. B. 1024"
        className="rounded-full border-none bg-[var(--field)] px-4 py-2 text-sm text-white placeholder:text-white/40"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-[var(--field)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Speichert...' : 'Speichern'}
      </button>
      <button onClick={() => { setEditing(false); setValue(saved ?? '') }} className="text-sm text-white/60 underline">
        Abbrechen
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </div>
  )
}
