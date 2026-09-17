import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ProjectDataSections from '@/components/ProjectDataSections'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import { getProjectOverview } from '@/lib/project-overview'
import { SERVICE_LABELS } from '@/lib/labels'

export default async function AdminProjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, service_type, companies(id, name)')
    .eq('id', id)
    .single()

  if (!project) {
    notFound()
  }

  const projectData = project as unknown as {
    id: string
    service_type: string
    companies: { id: string; name: string }
  }

  const { credentials, documents, questionnaireAnswers, links, deadlines, calendarEntries, meetings } =
    await getProjectOverview(supabase, id)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/admin/projekte" className="text-sm text-white/60 underline">
        ← Zurück zu Projekten
      </Link>
      <Link
        href={`/admin/kunden/${projectData.companies.id}`}
        className="mt-4 mb-1 block text-sm text-white/70 underline"
      >
        {projectData.companies.name}
      </Link>
      <div className="mb-4 flex items-start justify-between gap-2">
        <h1 className="text-2xl font-light">
          {SERVICE_LABELS[projectData.service_type] ?? projectData.service_type}
        </h1>
        <DeleteProjectButton
          projectId={id}
          projectLabel={`${projectData.companies.name} – ${SERVICE_LABELS[projectData.service_type] ?? projectData.service_type}`}
          redirectTo={`/admin/kunden/${projectData.companies.id}`}
        />
      </div>

      <ProjectDataSections
        projectId={id}
        serviceType={projectData.service_type}
        credentials={credentials}
        documents={documents}
        questionnaireAnswers={questionnaireAnswers}
        links={links}
        deadlines={deadlines}
        calendarEntries={calendarEntries}
        meetings={meetings}
      />
    </div>
  )
}
