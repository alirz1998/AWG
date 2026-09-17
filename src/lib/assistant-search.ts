import type { createClient } from '@/lib/supabase/server'
import { DOC_TYPE_LABELS, SERVICE_LABELS } from '@/lib/labels'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type CompanyRef = { name: string } | { name: string }[] | null
type ProjectRef = { service_type: string; companies: CompanyRef } | { service_type: string; companies: CompanyRef }[] | null

function companyName(companies: CompanyRef): string {
  if (!companies) return ''
  return Array.isArray(companies) ? companies[0]?.name ?? '' : companies.name ?? ''
}

function projectInfo(projects: ProjectRef): { company: string; service: string } {
  const p = Array.isArray(projects) ? projects[0] : projects
  if (!p) return { company: '', service: '' }
  return {
    company: companyName(p.companies),
    service: SERVICE_LABELS[p.service_type] ?? p.service_type,
  }
}

function matchesQuery(haystack: string, tokens: string[]): boolean {
  const h = haystack.toLowerCase()
  return tokens.every((t) => h.includes(t))
}

export type DocumentMatch = {
  company: string
  service: string
  label: string
  uploadedAt: string
  viewUrl: string | null
}

export type LinkMatch = {
  company: string
  service: string
  title: string
  url: string
}

export async function searchDocumentsAndLinks(
  supabase: SupabaseServerClient,
  query: string,
  projectIds: string[] | null
): Promise<{ documents: DocumentMatch[]; links: LinkMatch[] }> {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0 || (projectIds && projectIds.length === 0)) {
    return { documents: [], links: [] }
  }

  let docsQuery = supabase
    .from('documents')
    .select('id, doc_type, uploaded_at, file_url, project_id, projects(service_type, companies(name))')
    .order('uploaded_at', { ascending: false })
    .limit(200)
  if (projectIds) docsQuery = docsQuery.in('project_id', projectIds)

  let linksQuery = supabase
    .from('links')
    .select('id, title, url, project_id, projects(service_type, companies(name))')
    .order('created_at', { ascending: false })
    .limit(200)
  if (projectIds) linksQuery = linksQuery.in('project_id', projectIds)

  const [{ data: docs }, { data: linkRows }] = await Promise.all([docsQuery, linksQuery])

  const matchedDocs = (docs ?? [])
    .map((d) => {
      const { company, service } = projectInfo(d.projects as ProjectRef)
      const label = DOC_TYPE_LABELS[d.doc_type] ?? d.doc_type
      return { ...d, company, service, label }
    })
    .filter((d) => matchesQuery(`${d.company} ${d.service} ${d.label}`, tokens))
    .slice(0, 8)

  const matchedLinks = (linkRows ?? [])
    .map((l) => {
      const { company, service } = projectInfo(l.projects as ProjectRef)
      return { ...l, company, service }
    })
    .filter((l) => matchesQuery(`${l.company} ${l.service} ${l.title} ${l.url}`, tokens))
    .slice(0, 8)

  const documents: DocumentMatch[] = await Promise.all(
    matchedDocs.map(async (d) => {
      const { data: signed } = await supabase.storage.from('documents').createSignedUrl(d.file_url, 60 * 60)
      return {
        company: d.company,
        service: d.service,
        label: d.label,
        uploadedAt: new Date(d.uploaded_at).toLocaleDateString('de-AT'),
        viewUrl: signed?.signedUrl ?? null,
      }
    })
  )

  const links: LinkMatch[] = matchedLinks.map((l) => ({
    company: l.company,
    service: l.service,
    title: l.title,
    url: l.url,
  }))

  return { documents, links }
}
