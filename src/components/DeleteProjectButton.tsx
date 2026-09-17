'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteProjectButton({
  projectId,
  projectLabel,
  redirectTo,
}: {
  projectId: string
  projectLabel: string
  redirectTo: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    const confirmed = window.confirm(
      `Projekt "${projectLabel}" wirklich löschen? Damit werden auch alle Dokumente, Links, Zugangsdaten, Deadlines/Termine und Zugriffe auf dieses Projekt unwiderruflich gelöscht.`
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    const { data: documents } = await supabase.from('documents').select('file_url').eq('project_id', projectId)
    const paths = (documents ?? []).map((d) => d.file_url)
    if (paths.length > 0) {
      await supabase.storage.from('documents').remove(paths)
    }

    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId)

    setDeleting(false)

    if (deleteError) {
      setError('Projekt konnte nicht gelöscht werden.')
      return
    }

    router.push(redirectTo)
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-full border border-red-400/40 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 active:scale-95 active:bg-red-500/20 disabled:opacity-50"
      >
        {deleting ? 'Wird gelöscht...' : 'Projekt löschen'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
