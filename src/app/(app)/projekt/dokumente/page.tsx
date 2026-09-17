import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DocumentsList from '@/components/DocumentsList'
import { getDocuments } from '@/lib/project-overview'

export default async function ProjektDokumentePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const { project: projectParam } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: roles } = await supabase
    .from('user_project_roles')
    .select('role, project_id, projects(id, companies(name))')

  const projectRoles = (roles ?? []).filter((r) => r.project_id)
  if (projectRoles.length === 0) {
    redirect('/dashboard')
  }

  const selected = projectParam
    ? projectRoles.find((r) => r.project_id === projectParam) ?? projectRoles[0]
    : projectRoles[0]

  const project = selected.projects as unknown as { id: string; companies: { name: string } }
  const documents = await getDocuments(supabase, project.id)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">{project.companies.name}</p>
          <h1 className="text-2xl font-light">Dokumente</h1>
        </div>
        <Link
          href={`/dashboard?project=${project.id}`}
          className="rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
        >
          Zurück
        </Link>
      </div>

      <DocumentsList documents={documents} />
    </div>
  )
}
