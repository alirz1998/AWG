import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type Credential = {
  platform_name: string
  login: string | null
  password: string | null
  notes: string | null
}

export type DocumentWithLink = {
  id: string
  doc_type: string
  uploaded_at: string
  downloadUrl: string | null
}

export async function getProjectOverview(supabase: SupabaseServerClient, projectId: string) {
  const { data: credentials } = await supabase.rpc('get_credentials', {
    p_project_id: projectId,
  }) as { data: Credential[] | null }

  const { data: documents } = await supabase
    .from('documents')
    .select('id, doc_type, file_url, uploaded_at')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false })

  const documentsWithLinks: DocumentWithLink[] = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_url, 60 * 60)
      return {
        id: doc.id,
        doc_type: doc.doc_type,
        uploaded_at: doc.uploaded_at,
        downloadUrl: signed?.signedUrl ?? null,
      }
    })
  )

  return { credentials: credentials ?? [], documents: documentsWithLinks }
}
