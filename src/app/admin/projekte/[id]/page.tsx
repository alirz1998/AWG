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
    .select('id, service_type, companies(name)')
    .eq('id', id)
    .single()

  if (!project) {
    notFound()
  }

  const projectData = project as unknown as {
    id: string
    service_type: string
    companies: { name: string }
  }

  const { credentials, documents } = await getProjectOverview(supabase, id)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/admin/projekte" className="text-sm text-white/60 underline">
        ← Zurück zu Projekten
      </Link>
      <p className="mt-4 mb-1 text-sm text-white/70">{projectData.companies.name}</p>
      <h1 className="mb-6 text-xl font-semibold">
        {SERVICE_LABELS[projectData.service_type] ?? projectData.service_type}
      </h1>

      <ProjectDataSections credentials={credentials} documents={documents} />
    </div>
  )
}
