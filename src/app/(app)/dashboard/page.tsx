import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavMenu from '@/components/NavMenu'
import DashboardCard, { AnimatedNumber } from '@/components/DashboardCard'
import { UsersIcon, FolderIcon, MailIcon, BriefcaseIcon, TargetIcon, FileIcon, LinkIcon, ChartIcon } from '@/components/icons'
import { STAFF_NAV_ITEMS, getClientNavItems } from '@/lib/navigation'
import { SERVICE_LABELS } from '@/lib/labels'
import { QUESTIONNAIRE_QUESTIONS } from '@/lib/questionnaire'

const PROJECT_STATUS_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
}

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
    .select('role, project_id, projects(id, service_type, status, companies(name))')

  // AWG-Staff hat keine eigenen Kundenprojekte -> eigene Ansicht
  const isStaff = roles?.some((r) => r.role === 'awg_admin' || r.role === 'awg_team')

  const vorname = user.user_metadata?.vorname as string | undefined
  const displayName = vorname || user.email

  if (isStaff) {
    const [
      { count: companiesCount },
      { count: projectsCount },
      { count: openInvitesCount },
      { data: staffRoleRows },
    ] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('status', 'offen'),
      supabase.from('user_project_roles').select('user_id').in('role', ['awg_admin', 'awg_team']),
    ])

    const teamCount = new Set((staffRoleRows ?? []).map((r) => r.user_id)).size

    return (
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col p-8">
        <div className="mb-8">
          <NavMenu items={STAFF_NAV_ITEMS} />
        </div>
        <h1 className="mb-1 text-center text-2xl font-light">Willkommen, {displayName}</h1>
        <p className="mb-8 text-center text-sm text-white/70">Du bist als AWG-Team eingeloggt.</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DashboardCard href="/admin/kunden" icon={<UsersIcon className="h-5 w-5" />} accent="bg-sky-400/20 text-sky-300" delay={0}>
            <span className="text-2xl font-light"><AnimatedNumber value={companiesCount ?? 0} delay={0} /></span>
            <span className="text-xs text-white/70">Kunden</span>
          </DashboardCard>

          <DashboardCard href="/admin/projekte" icon={<FolderIcon className="h-5 w-5" />} accent="bg-emerald-400/20 text-emerald-300" delay={80}>
            <span className="text-2xl font-light"><AnimatedNumber value={projectsCount ?? 0} delay={80} /></span>
            <span className="text-xs text-white/70">Projekte</span>
          </DashboardCard>

          <DashboardCard
            href="/admin/einladungen"
            icon={<MailIcon className="h-5 w-5" />}
            accent="bg-amber-400/20 text-amber-300"
            delay={160}
            badge={(openInvitesCount ?? 0) > 0}
          >
            <span className="text-2xl font-light"><AnimatedNumber value={openInvitesCount ?? 0} delay={160} /></span>
            <span className="text-xs text-white/70">Offene Einladungen</span>
          </DashboardCard>

          <DashboardCard href="/admin/team" icon={<BriefcaseIcon className="h-5 w-5" />} accent="bg-violet-400/20 text-violet-300" delay={240}>
            <span className="text-2xl font-light"><AnimatedNumber value={teamCount} delay={240} /></span>
            <span className="text-xs text-white/70">Team-Mitglieder</span>
          </DashboardCard>
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
    status: string
    companies: { name: string }
  }

  const [{ count: docsCount }, { count: linksCount }, { data: answerRows }] = await Promise.all([
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
    supabase.from('links').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
    supabase.from('questionnaire_responses').select('question_key').eq('project_id', project.id),
  ])

  const answeredCount = answerRows?.length ?? 0
  const totalQuestions = QUESTIONNAIRE_QUESTIONS.length

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardCard href={`/projekt?project=${project.id}`} icon={<ChartIcon className="h-5 w-5" />} accent="bg-sky-400/20 text-sky-300" delay={0}>
          <span className="text-lg font-light">{PROJECT_STATUS_LABELS[project.status] ?? project.status}</span>
          <span className="text-xs text-white/70">Projektstatus</span>
        </DashboardCard>

        <DashboardCard
          href={`/fragebogen?project=${project.id}`}
          icon={<TargetIcon className="h-5 w-5" />}
          accent="bg-emerald-400/20 text-emerald-300"
          delay={80}
          badge={answeredCount < totalQuestions}
        >
          <span className="text-2xl font-light">
            <AnimatedNumber value={answeredCount} delay={80} />
            <span className="text-white/50">/{totalQuestions}</span>
          </span>
          <span className="text-xs text-white/70">Zielgruppenanalyse</span>
        </DashboardCard>

        <DashboardCard href={`/projekt?project=${project.id}`} icon={<FileIcon className="h-5 w-5" />} accent="bg-amber-400/20 text-amber-300" delay={160}>
          <span className="text-2xl font-light"><AnimatedNumber value={docsCount ?? 0} delay={160} /></span>
          <span className="text-xs text-white/70">Dokumente</span>
        </DashboardCard>

        <DashboardCard href={`/projekt?project=${project.id}`} icon={<LinkIcon className="h-5 w-5" />} accent="bg-violet-400/20 text-violet-300" delay={240}>
          <span className="text-2xl font-light"><AnimatedNumber value={linksCount ?? 0} delay={240} /></span>
          <span className="text-xs text-white/70">Links</span>
        </DashboardCard>
      </div>
    </div>
  )
}
