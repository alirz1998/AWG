import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavMenu from '@/components/NavMenu'
import AssistantChat from '@/components/AssistantChat'
import { STAFF_NAV_ITEMS, getClientNavItems } from '@/lib/navigation'
import { SERVICE_LABELS } from '@/lib/labels'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const { project: projectParam } = await searchParams
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
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col p-8">
        <div className="mb-8">
          <NavMenu items={STAFF_NAV_ITEMS} />
        </div>
        <h1 className="mb-1 text-center text-2xl font-light">Willkommen, {displayName}</h1>
        <p className="mb-8 text-center text-sm text-white/70">Du bist als AWG-Team eingeloggt.</p>
        <div className="flex flex-1 items-start justify-center">
          <AssistantChat
            greeting={`Hallo ${displayName}, wobei kann ich helfen? Ich kann dir z.B. helfen, einen Kunden einzuladen oder die passende Seite zu öffnen.`}
          />
        </div>
      </div>
    )
  }

  const projectRoles = (roles ?? []).filter((r) => r.project_id)

  if (projectRoles.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-white/70">
          Dein Konto ist noch keinem Projekt zugewiesen. Bitte wende dich an dein AWG-Kontakt.
        </p>
      </div>
    )
  }

  const selected = projectParam
    ? projectRoles.find((r) => r.project_id === projectParam) ?? projectRoles[0]
    : projectRoles[0]

  const project = selected.projects as unknown as {
    id: string
    service_type: string
    companies: { name: string }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col p-8">
      <div className="mb-8">
        <NavMenu items={getClientNavItems(project.id)} />
      </div>

      <p className="text-center text-sm text-white/70">{project.companies.name}</p>
      <h1 className="mb-1 text-center text-2xl font-light">Willkommen, {displayName}</h1>
      <p className="mb-6 text-center text-sm text-white/70">
        {SERVICE_LABELS[project.service_type] ?? project.service_type}
      </p>

      {projectRoles.length > 1 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {projectRoles.map((r) => {
            const p = r.projects as unknown as { id: string; service_type: string }
            const isActive = p.id === project.id
            return (
              <Link
                key={p.id}
                href={`/dashboard?project=${p.id}`}
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

      <div className="flex flex-1 items-start justify-center">
        <AssistantChat
          projectId={project.id}
          greeting={`Hallo ${displayName}, wobei kann ich helfen? Ich kann dir z.B. helfen, die Zielgruppenanalyse zu öffnen oder deine Projektübersicht zu finden.`}
        />
      </div>
    </div>
  )
}
