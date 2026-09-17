import { DOC_TYPE_LABELS } from '@/lib/labels'
import type { Credential, DocumentWithLink, ProjectLink } from '@/lib/project-overview'
import { QUESTIONNAIRE_QUESTIONS, type QuestionnaireAnswer } from '@/lib/questionnaire'

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
      <details className="group rounded-md border border-white/15 p-3">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Zugangsdaten
        </summary>
        <div className="mt-3">
          {credentials.length === 0 ? (
            <p className="text-sm text-white/60">Noch keine Zugangsdaten hinterlegt.</p>
          ) : (
            <ul className="space-y-2">
              {credentials.map((c, i) => (
                <li key={i} className="rounded-md border border-white/15 p-3 text-sm">
                  <p className="font-medium">{c.platform_name}</p>
                  {c.login && <p className="text-white/70">Login: {c.login}</p>}
                  {c.password && <p className="text-white/70">Passwort: {c.password}</p>}
                  {c.notes && <p className="text-white/70">{c.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      <details className="group rounded-md border border-white/15 p-3">
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
                    <li key={q.key} className="rounded-md border border-white/15 p-3 text-sm">
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

      <details className="group rounded-md border border-white/15 p-3">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Verträge, Angebote & Dokumente
        </summary>
        <div className="mt-3">
          {documents.length === 0 ? (
            <p className="text-sm text-white/60">Noch kein Dokument hinterlegt.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border border-white/15 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                    </p>
                    <p className="text-white/60">
                      {new Date(doc.uploaded_at).toLocaleDateString('de-AT')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {doc.viewUrl && (
                      <a
                        href={doc.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium"
                      >
                        Anzeigen
                      </a>
                    )}
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium"
                      >
                        Herunterladen
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      <details className="group rounded-md border border-white/15 p-3">
        <summary className="cursor-pointer list-none font-medium marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          Links
        </summary>
        <div className="mt-3">
          {links.length === 0 ? (
            <p className="text-sm text-white/60">Noch keine Links hinterlegt.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.id} className="rounded-md border border-white/15 p-3 text-sm">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  )
}
