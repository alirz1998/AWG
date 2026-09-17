import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ProjectDataSections from '@/components/ProjectDataSections'
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

  const { credentials, documents, questionnaireAnswers, links } = await getProjectOverview(supabase, id)

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
      <h1 className="mb-4 text-xl font-semibold">
        {SERVICE_LABELS[projectData.service_type] ?? projectData.service_type}
      </h1>

      <Link
        href={`/fragebogen?project=${id}`}
        className="mx-auto mb-6 block w-fit rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white"
      >
        Zielgruppenanalyse bearbeiten
      </Link>

      <ProjectDataSections
        credentials={credentials}
        documents={documents}
        questionnaireAnswers={questionnaireAnswers}
        links={links}
      />
    </div>
  )
}
