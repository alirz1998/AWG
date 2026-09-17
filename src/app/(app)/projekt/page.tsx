import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProjectDataSections from '@/components/ProjectDataSections'
import { getProjectOverview } from '@/lib/project-overview'
import { SERVICE_LABELS } from '@/lib/labels'

export default async function ProjektPage({
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
    .select('role, project_id, projects(id, service_type, companies(name))')

  const projectRoles = (roles ?? []).filter((r) => r.project_id)

  if (projectRoles.length === 0) {
    redirect('/dashboard')
  }

  const selected = projectParam
    ? projectRoles.find((r) => r.project_id === projectParam) ?? projectRoles[0]
    : projectRoles[0]

  const project = selected.projects as unknown as {
    id: string
    service_type: string
    companies: { name: string }
  }

  const { credentials, documents, questionnaireAnswers, links } = await getProjectOverview(supabase, project.id)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">{project.companies.name}</p>
          <h1 className="text-2xl font-light">Projektübersicht</h1>
          <p className="text-sm text-white/60">{SERVICE_LABELS[project.service_type] ?? project.service_type}</p>
        </div>
        <Link
          href={`/dashboard?project=${project.id}`}
          className="rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
        >
          Zurück
        </Link>
      </div>

      {projectRoles.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {projectRoles.map((r) => {
            const p = r.projects as unknown as { id: string; service_type: string }
            const isActive = p.id === project.id
            return (
              <Link
                key={p.id}
                href={`/projekt?project=${p.id}`}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'border-white bg-[var(--field)]' : 'border-white/30'
                }`}
              >
                {SERVICE_LABELS[p.service_type] ?? p.service_type}
              </Link>
            )
          })}
        </div>
      )}

      <ProjectDataSections
        credentials={credentials}
        documents={documents}
        questionnaireAnswers={questionnaireAnswers}
        links={links}
      />
    </div>
  )
}
