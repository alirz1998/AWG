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

export type Deadline = {
  id: string
  title: string
  due_date: string
}

export type CalendarEntry = {
  id: string
  title: string
  scheduled_at: string
  notes: string | null
}

export type Meeting = {
  id: string
  title: string
  meeting_date: string
  notes: string | null
}

export async function getCredentials(supabase: SupabaseServerClient, projectId: string): Promise<Credential[]> {
  const { data } = (await supabase.rpc('get_credentials', { p_project_id: projectId })) as {
    data: Credential[] | null
  }
  return data ?? []
}

export async function getDocuments(supabase: SupabaseServerClient, projectId: string): Promise<DocumentWithLink[]> {
  const { data: documents } = await supabase
    .from('documents')
    .select('id, doc_type, file_url, uploaded_at')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false })

  return Promise.all(
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
}

export async function getLinks(supabase: SupabaseServerClient, projectId: string): Promise<ProjectLink[]> {
  const { data: links } = await supabase
    .from('links')
    .select('id, title, url')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  return (links ?? []) as ProjectLink[]
}

export async function getDeadlines(supabase: SupabaseServerClient, projectId: string): Promise<Deadline[]> {
  const { data } = await supabase
    .from('deadlines')
    .select('id, title, due_date')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true })

  return (data ?? []) as Deadline[]
}

export async function getCalendarEntries(supabase: SupabaseServerClient, projectId: string): Promise<CalendarEntry[]> {
  const { data } = await supabase
    .from('calendar_entries')
    .select('id, title, scheduled_at, notes')
    .eq('project_id', projectId)
    .order('scheduled_at', { ascending: true })

  return (data ?? []) as CalendarEntry[]
}

export async function getMeetings(supabase: SupabaseServerClient, projectId: string): Promise<Meeting[]> {
  const { data } = await supabase
    .from('meetings')
    .select('id, title, meeting_date, notes')
    .eq('project_id', projectId)
    .order('meeting_date', { ascending: true })

  return (data ?? []) as Meeting[]
}

export async function getQuestionnaireAnswers(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<Record<string, QuestionnaireAnswer>> {
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
  return questionnaireAnswers
}

export async function getProjectOverview(supabase: SupabaseServerClient, projectId: string) {
  const [credentials, documents, questionnaireAnswers, links, deadlines, calendarEntries, meetings] =
    await Promise.all([
      getCredentials(supabase, projectId),
      getDocuments(supabase, projectId),
      getQuestionnaireAnswers(supabase, projectId),
      getLinks(supabase, projectId),
      getDeadlines(supabase, projectId),
      getCalendarEntries(supabase, projectId),
      getMeetings(supabase, projectId),
    ])

  return { credentials, documents, questionnaireAnswers, links, deadlines, calendarEntries, meetings }
}
