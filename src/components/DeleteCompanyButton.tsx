'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteCompanyButton({
  companyId,
  companyName,
}: {
  companyId: string
  companyName: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    const confirmed = window.confirm(
      `"${companyName}" wirklich löschen? Damit werden auch alle Projekte, Dokumente, Links, Zugangsdaten, Deadlines/Termine und Zugriffe dieses Kunden unwiderruflich gelöscht.`
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    const { data: projects } = await supabase.from('projects').select('id').eq('company_id', companyId)
    const projectIds = (projects ?? []).map((p) => p.id)

    if (projectIds.length > 0) {
      const { data: documents } = await supabase.from('documents').select('file_url').in('project_id', projectIds)
      const paths = (documents ?? []).map((d) => d.file_url)
      if (paths.length > 0) {
        await supabase.storage.from('documents').remove(paths)
      }
    }

    const { error: deleteError } = await supabase.from('companies').delete().eq('id', companyId)

    setDeleting(false)

    if (deleteError) {
      setError('Kunde konnte nicht gelöscht werden.')
      return
    }

    router.push('/admin/kunden')
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-full border border-red-400/40 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 active:scale-95 active:bg-red-500/20 disabled:opacity-50"
      >
        {deleting ? 'Wird gelöscht...' : 'Kunde löschen'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
