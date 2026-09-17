import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NavMenu from '@/components/NavMenu'
import DashboardCard, { AnimatedNumber } from '@/components/DashboardCard'
import {
  UsersIcon,
  FolderIcon,
  BriefcaseIcon,
  TargetIcon,
  FileIcon,
  LinkIcon,
  ClockIcon,
  CalendarIcon,
  KeyIcon,
  HashIcon,
} from '@/components/icons'
import { STAFF_NAV_ITEMS, getClientNavItems } from '@/lib/navigation'
import { SERVICE_LABELS } from '@/lib/labels'
import { QUESTIONNAIRE_QUESTIONS } from '@/lib/questionnaire'
import { hasDeadlines, hasCalendar } from '@/lib/project-features'
import { getUpcomingEvents, countEventsWithinDays } from '@/lib/calendar-overview'

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
    .select('role, project_id, projects(id, service_type, status, companies(name, kundennummer))')

  // AWG-Staff hat keine eigenen Kundenprojekte -> eigene Ansicht
  const isStaff = roles?.some((r) => r.role === 'awg_admin' || r.role === 'awg_team')

  const vorname = user.user_metadata?.vorname as string | undefined
  const displayName = vorname || user.email

  if (isStaff) {
    const [
      { count: companiesCount },
      { count: projectsCount },
      { data: staffRoleRows },
      { data: allProjects },
      { data: responseRows },
      upcomingEvents,
    ] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('user_project_roles').select('user_id').in('role', ['awg_admin', 'awg_team']),
      supabase.from('projects').select('id'),
      supabase.from('questionnaire_responses').select('project_id'),
      getUpcomingEvents(supabase),
    ])

    const teamCount = new Set((staffRoleRows ?? []).map((r) => r.user_id)).size

    const totalQuestions = QUESTIONNAIRE_QUESTIONS.length
    const answeredCounts = new Map<string, number>()
    for (const row of responseRows ?? []) {
      answeredCounts.set(row.project_id, (answeredCounts.get(row.project_id) ?? 0) + 1)
    }
    const incompleteQuestionnaireCount = (allProjects ?? []).filter(
      (p) => (answeredCounts.get(p.id) ?? 0) < totalQuestions
    ).length

    const upcomingCount = countEventsWithinDays(upcomingEvents, 14)

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
            href="/admin/projekte"
            icon={<TargetIcon className="h-5 w-5" />}
            accent="bg-amber-400/20 text-amber-300"
            delay={160}
            badge={incompleteQuestionnaireCount > 0}
          >
            <span className="text-2xl font-light"><AnimatedNumber value={incompleteQuestionnaireCount} delay={160} /></span>
            <span className="text-xs text-white/70">Zielgruppenanalyse ausstehend</span>
          </DashboardCard>

          <DashboardCard href="/admin/team" icon={<BriefcaseIcon className="h-5 w-5" />} accent="bg-violet-400/20 text-violet-300" delay={240}>
            <span className="text-2xl font-light"><AnimatedNumber value={teamCount} delay={240} /></span>
            <span className="text-xs text-white/70">Team-Mitglieder</span>
          </DashboardCard>

          <DashboardCard href="/admin/termine" icon={<CalendarIcon className="h-5 w-5" />} accent="bg-teal-400/20 text-teal-300" delay={320}>
            <span className="text-2xl font-light"><AnimatedNumber value={upcomingCount} delay={320} /></span>
            <span className="text-xs text-white/70">Kalender (14 Tage)</span>
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
    companies: { name: string; kundennummer: string | null }
  }

  const showsDeadlines = hasDeadlines(project.service_type)
  const showsCalendar = hasCalendar(project.service_type)

  const [
    { count: docsCount },
    { count: linksCount },
    { count: credentialsCount },
    { data: answerRows },
    { data: nextDeadline },
    { data: nextEntry },
  ] = await Promise.all([
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
    supabase.from('links').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
    supabase.rpc('get_credentials', { p_project_id: project.id }).then(({ data, error }) => ({
      count: error ? 0 : (data as unknown[] | null)?.length ?? 0,
    })),
    supabase.from('questionnaire_responses').select('question_key').eq('project_id', project.id),
    showsDeadlines
      ? supabase
          .from('deadlines')
          .select('title, due_date')
          .eq('project_id', project.id)
          .gte('due_date', new Date().toISOString().slice(0, 10))
          .order('due_date', { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    showsCalendar
      ? supabase
          .from('calendar_entries')
          .select('title, scheduled_at')
          .eq('project_id', project.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const answeredCount = answerRows?.length ?? 0
  const totalQuestions = QUESTIONNAIRE_QUESTIONS.length

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col p-8">
      <div className="mb-8">
        <NavMenu items={getClientNavItems(project.id, project.service_type)} />
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
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
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
        {showsDeadlines && (
          <DashboardCard
            href={`/projekt/deadlines?project=${project.id}`}
            icon={<ClockIcon className="h-5 w-5" />}
            accent="bg-sky-400/20 text-sky-300"
            delay={0}
          >
            {nextDeadline ? (
              <>
                <span className="text-lg font-light">
                  {new Date(nextDeadline.due_date).toLocaleDateString('de-AT')}
                </span>
                <span className="truncate text-xs text-white/70">{nextDeadline.title}</span>
              </>
            ) : (
              <>
                <span className="text-lg font-light">—</span>
                <span className="text-xs text-white/70">Keine Deadline</span>
              </>
            )}
          </DashboardCard>
        )}

        {showsCalendar && (
          <DashboardCard
            href={`/projekt/kalender?project=${project.id}`}
            icon={<CalendarIcon className="h-5 w-5" />}
            accent="bg-sky-400/20 text-sky-300"
            delay={0}
          >
            {nextEntry ? (
              <>
                <span className="text-lg font-light">
                  {new Date(nextEntry.scheduled_at).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })}
                </span>
                <span className="truncate text-xs text-white/70">{nextEntry.title}</span>
              </>
            ) : (
              <>
                <span className="text-lg font-light">—</span>
                <span className="text-xs text-white/70">Kein Termin geplant</span>
              </>
            )}
          </DashboardCard>
        )}

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

        <DashboardCard href={`/projekt/dokumente?project=${project.id}`} icon={<FileIcon className="h-5 w-5" />} accent="bg-amber-400/20 text-amber-300" delay={160}>
          <span className="text-2xl font-light"><AnimatedNumber value={docsCount ?? 0} delay={160} /></span>
          <span className="text-xs text-white/70">Dokumente</span>
        </DashboardCard>

        <DashboardCard href={`/projekt/links?project=${project.id}`} icon={<LinkIcon className="h-5 w-5" />} accent="bg-violet-400/20 text-violet-300" delay={240}>
          <span className="text-2xl font-light"><AnimatedNumber value={linksCount ?? 0} delay={240} /></span>
          <span className="text-xs text-white/70">Links</span>
        </DashboardCard>

        <DashboardCard href={`/projekt/zugangsdaten?project=${project.id}`} icon={<KeyIcon className="h-5 w-5" />} accent="bg-teal-400/20 text-teal-300" delay={320}>
          <span className="text-2xl font-light"><AnimatedNumber value={credentialsCount ?? 0} delay={320} /></span>
          <span className="text-xs text-white/70">Zugangsdaten</span>
        </DashboardCard>

        <DashboardCard href={`/projekt?project=${project.id}`} icon={<HashIcon className="h-5 w-5" />} accent="bg-rose-400/20 text-rose-300" delay={400}>
          <span className="text-lg font-light">{project.companies.kundennummer ?? '—'}</span>
          <span className="text-xs text-white/70">Kundennummer</span>
        </DashboardCard>
      </div>
    </div>
  )
}
