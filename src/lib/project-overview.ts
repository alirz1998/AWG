import type { createClient } from '@/lib/supabase/server'
import type { QuestionnaireAnswer } from '@/lib/questionnaire'

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
  viewUrl: string | null
  downloadUrl: string | null
}

export type ProjectLink = {
  id: string
  title: string
  url: string
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
      const [{ data: viewSigned }, { data: downloadSigned }] = await Promise.all([
        supabase.storage.from('documents').createSignedUrl(doc.file_url, 60 * 60),
        supabase.storage.from('documents').createSignedUrl(doc.file_url, 60 * 60, { download: true }),
      ])
      return {
        id: doc.id,
        doc_type: doc.doc_type,
        uploaded_at: doc.uploaded_at,
        viewUrl: viewSigned?.signedUrl ?? null,
        downloadUrl: downloadSigned?.signedUrl ?? null,
      }
    })
  )

  const { data: answerRows } = await supabase
    .from('questionnaire_responses')
    .select('question_key, answer')
    .eq('project_id', projectId)

  const questionnaireAnswers: Record<string, QuestionnaireAnswer> = {}
  for (const row of answerRows ?? []) {
    try {
      questionnaireAnswers[row.question_key] = JSON.parse(row.answer ?? '{}')
    } catch {
      questionnaireAnswers[row.question_key] = { choice: row.answer ?? '', zusatz: '' }
    }
  }

  const { data: links } = await supabase
    .from('links')
    .select('id, title, url')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return {
    credentials: credentials ?? [],
    documents: documentsWithLinks,
    questionnaireAnswers,
    links: (links ?? []) as ProjectLink[],
  }
}
