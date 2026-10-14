'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteItemButton({
  table,
  id,
  label,
  onDeleted,
}: {
  table: 'links' | 'meetings' | 'invitations' | 'credentials'
  id: string
  label: string
  onDeleted?: () => void
}) {
  const supabase = createClient()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    let failure: string | null = null
    if (table === 'credentials') {
      const { error: rpcError } = await supabase.rpc('delete_credential', { p_credential_id: id })
      failure = rpcError?.message ?? null
    } else {
      const { data, error: deleteError } = await supabase.from(table).delete().eq('id', id).select('id')
      failure = deleteError?.message ?? (data && data.length === 0 ? 'keine Berechtigung' : null)
    }

    setDeleting(false)
    setConfirming(false)

    if (failure) {
      setError(`Konnte nicht gelöscht werden (${failure}).`)
      return
    }

    if (onDeleted) onDeleted()
    else router.refresh()
  }

  if (confirming) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-red-200">&quot;{label}&quot; wirklich löschen?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-full bg-red-500/80 px-3 py-1.5 font-medium text-white transition active:scale-95 disabled:opacity-50"
        >
          {deleting ? 'Wird gelöscht...' : 'Ja, löschen'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-full border border-white/30 px-3 py-1.5 font-medium transition active:scale-95"
        >
          Abbrechen
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="mt-2 inline-block rounded-full border border-red-400/40 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 active:scale-95"
      >
        Löschen
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </>
  )
}
