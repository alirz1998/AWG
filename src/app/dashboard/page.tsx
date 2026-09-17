import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import ProjectDataSections from '@/components/ProjectDataSections'
import { getProjectOverview } from '@/lib/project-overview'
import { ROLE_LABELS, SERVICE_LABELS } from '@/lib/labels'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: roles } = await supabase
    .from('user_project_roles')
    .select('role, project_id, projects(id, service_type, companies(name))')

  // AWG-Staff hat keine eigenen Kundenprojekte -> eigene Ansicht
  const isStaff = roles?.some((r) => r.role === 'awg_admin' || r.role === 'awg_team')

  const vorname = user.user_metadata?.vorname as string | undefined
  const displayName = vorname || user.email

  if (isStaff) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Willkommen, {displayName}</h1>
          <LogoutButton />
        </div>
        <p className="mb-6 text-sm text-white/70">Du bist als AWG-Team eingeloggt.</p>
        <div className="flex flex-col items-start gap-3">
          <a
            href="/admin/einladungen"
            className="inline-block rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white"
          >
            Neuen Kunden einladen
          </a>
          <Link
            href="/admin/projekte"
            className="inline-block rounded-md border border-white/30 px-4 py-2 text-sm font-medium"
          >
            Projekte ansehen
          </Link>
          <a
            href="/admin/team"
            className="inline-block rounded-md border border-white/30 px-4 py-2 text-sm font-medium"
          >
            Team-Mitglied einladen
          </a>
          <a
            href="/admin/zugangsdaten"
            className="inline-block rounded-md border border-white/30 px-4 py-2 text-sm font-medium"
          >
            Zugangsdaten hinterlegen
          </a>
          <a
            href="/admin/dokumente"
            className="inline-block rounded-md border border-white/30 px-4 py-2 text-sm font-medium"
          >
            Dokument hochladen
          </a>
        </div>
      </div>
    )
  }

  const firstProject = roles?.[0]

  if (!firstProject) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-white/70">
          Dein Konto ist noch keinem Projekt zugewiesen. Bitte wende dich an dein AWG-Kontakt.
        </p>
      </div>
    )
  }

  const project = firstProject.projects as unknown as {
    id: string
    service_type: string
    companies: { name: string }
  }

  const { credentials, documents } = await getProjectOverview(supabase, project.id)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm text-white/70">{project.companies.name}</p>
        <LogoutButton />
      </div>
      <h1 className="mb-1 text-xl font-semibold">Willkommen, {displayName}</h1>
      <p className="mb-1 text-sm text-white/70">
        {SERVICE_LABELS[project.service_type] ?? project.service_type}
      </p>
      <p className="mb-6 text-sm text-white/60">
        Deine Rolle: {ROLE_LABELS[firstProject.role] ?? firstProject.role}
      </p>

      <ProjectDataSections credentials={credentials} documents={documents} />
    </div>
  )
}
