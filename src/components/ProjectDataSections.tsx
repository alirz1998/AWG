import type { Credential, DocumentWithLink, ProjectLink } from '@/lib/project-overview'
import { QUESTIONNAIRE_QUESTIONS, type QuestionnaireAnswer } from '@/lib/questionnaire'
import CredentialsList from '@/components/CredentialsList'
import DocumentsList from '@/components/DocumentsList'
import LinksList from '@/components/LinksList'

export default function ProjectDataSections({
  credentials,
  documents,
  questionnaireAnswers,
  links,
}: {
  credentials: Credential[]
  documents: DocumentWithLink[]
  questionnaireAnswers: Record<string, QuestionnaireAnswer>
  links: ProjectLink[]
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
        <div className="mt-3">
          <CredentialsList credentials={credentials} />
        </div>
      </details>

      <details className="group rounded-3xl bg-[var(--card)] p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Zielgruppenanalyse
        </summary>
        <div className="mt-3 space-y-4">
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
        <div className="mt-3">
          <DocumentsList documents={documents} />
        </div>
      </details>

      <details className="group rounded-3xl bg-[var(--card)] p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Links
        </summary>
        <div className="mt-3">
          <LinksList links={links} />
        </div>
      </details>
    </div>
  )
}
