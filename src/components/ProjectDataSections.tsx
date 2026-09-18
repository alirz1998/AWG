import Link from 'next/link'
import type { Credential, DocumentWithLink, ProjectLink, Deadline, CalendarEntry, Meeting } from '@/lib/project-overview'
import { QUESTIONNAIRE_QUESTIONS, type QuestionnaireAnswer } from '@/lib/questionnaire'
import { hasDeadlines, hasCalendar } from '@/lib/project-features'
import CredentialsList from '@/components/CredentialsList'
import DocumentsList from '@/components/DocumentsList'
import LinksList from '@/components/LinksList'
import DeadlinesList from '@/components/DeadlinesList'
import CalendarEntriesList from '@/components/CalendarEntriesList'
import MeetingsList from '@/components/MeetingsList'

export default function ProjectDataSections({
  projectId,
  serviceType,
  credentials,
  documents,
  questionnaireAnswers,
  links,
  deadlines,
  calendarEntries,
  meetings,
  editable,
}: {
  projectId: string
  serviceType: string
  credentials: Credential[]
  documents: DocumentWithLink[]
  questionnaireAnswers: Record<string, QuestionnaireAnswer>
  links: ProjectLink[]
  deadlines: Deadline[]
  calendarEntries: CalendarEntry[]
  meetings: Meeting[]
  editable?: boolean
}) {
  const questionsBySection = QUESTIONNAIRE_QUESTIONS.reduce<Record<string, typeof QUESTIONNAIRE_QUESTIONS>>(
    (acc, q) => {
      ;(acc[q.sectionLabel] ??= []).push(q)
      return acc
    },
    {}
  )
  return (
    <div className="space-y-3">
      <details className="group rounded-3xl bg-[var(--card)] p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Zugangsdaten
        </summary>
        <div className="mt-3 space-y-3">
          <CredentialsList credentials={credentials} />
          {editable && (
            <Link
              href={`/admin/zugangsdaten?project=${projectId}`}
              className="mx-auto block w-fit rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
            >
              {credentials.length === 0 ? '+ Zugangsdaten hinzufügen' : '+ Weitere Zugangsdaten hinzufügen'}
            </Link>
          )}
        </div>
      </details>

      <details className="group rounded-3xl bg-[var(--card)] p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Zielgruppenanalyse
        </summary>
        <div className="mt-3 space-y-4">
          <Link
            href={`/fragebogen?project=${projectId}`}
            className="mx-auto block w-fit rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
          >
            Zielgruppenanalyse bearbeiten
          </Link>
          {Object.entries(questionsBySection).map(([sectionLabel, questions]) => (
            <div key={sectionLabel}>
              <h3 className="mb-2 text-sm font-medium text-white/70">{sectionLabel}</h3>
              <ul className="space-y-2">
                {questions.map((q) => {
                  const answer = questionnaireAnswers[q.key]
                  return (
                    <li key={q.key} className="rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm">
                      <p className="font-medium">{q.label}</p>
                      {answer?.choice ? (
                        <>
                          <p className="text-white/70">{answer.choice}</p>
                          {answer.zusatz && <p className="text-white/60">{answer.zusatz}</p>}
                        </>
                      ) : (
                        <p className="text-white/50">Noch nicht beantwortet.</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <details className="group rounded-3xl bg-[var(--card)] p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Verträge, Angebote & Dokumente
        </summary>
        <div className="mt-3 space-y-3">
          <DocumentsList documents={documents} />
          {editable && (
            <Link
              href={`/admin/dokumente?project=${projectId}`}
              className="mx-auto block w-fit rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
            >
              {documents.length === 0 ? '+ Dokument hinzufügen' : '+ Weiteres Dokument hinzufügen'}
            </Link>
          )}
        </div>
      </details>

      <details className="group rounded-3xl bg-[var(--card)] p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Links
        </summary>
        <div className="mt-3 space-y-3">
          <LinksList links={links} />
          {editable && (
            <Link
              href={`/admin/links?project=${projectId}`}
              className="mx-auto block w-fit rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
            >
              {links.length === 0 ? '+ Link hinzufügen' : '+ Weiteren Link hinzufügen'}
            </Link>
          )}
        </div>
      </details>

      {hasDeadlines(serviceType) && (
        <details className="group rounded-3xl bg-[var(--card)] p-5">
          <summary className="cursor-pointer list-none font-medium marker:content-none">
            <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
            Deadlines
          </summary>
          <div className="mt-3 space-y-3">
            <DeadlinesList deadlines={deadlines} />
            {editable && (
              <Link
                href={`/admin/deadlines?project=${projectId}`}
                className="mx-auto block w-fit rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
              >
                {deadlines.length === 0 ? '+ Deadline hinzufügen' : '+ Weitere Deadline hinzufügen'}
              </Link>
            )}
          </div>
        </details>
      )}

      {hasCalendar(serviceType) && (
        <details className="group rounded-3xl bg-[var(--card)] p-5">
          <summary className="cursor-pointer list-none font-medium marker:content-none">
            <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
            Termine
          </summary>
          <div className="mt-3 space-y-3">
            <CalendarEntriesList entries={calendarEntries} editable={editable} />
            {editable && (
              <Link
                href={`/admin/kalender?project=${projectId}`}
                className="mx-auto block w-fit rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
              >
                {calendarEntries.length === 0 ? '+ Termin hinzufügen' : '+ Weiteren Termin hinzufügen'}
              </Link>
            )}
          </div>
        </details>
      )}

      <details className="group rounded-3xl bg-[var(--card)] p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Meetings
        </summary>
        <div className="mt-3 space-y-3">
          <MeetingsList meetings={meetings} editable={editable} />
          {editable && (
            <Link
              href={`/admin/meetings?project=${projectId}`}
              className="mx-auto block w-fit rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
            >
              {meetings.length === 0 ? '+ Meeting hinzufügen' : '+ Weiteres Meeting hinzufügen'}
            </Link>
          )}
        </div>
      </details>
    </div>
  )
}
