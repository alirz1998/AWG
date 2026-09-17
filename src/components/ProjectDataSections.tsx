import { DOC_TYPE_LABELS } from '@/lib/labels'
import type { Credential, DocumentWithLink } from '@/lib/project-overview'

export default function ProjectDataSections({
  credentials,
  documents,
}: {
  credentials: Credential[]
  documents: DocumentWithLink[]
}) {
  return (
    <>
      <section className="mb-8">
        <h2 className="mb-3 font-medium">Zugangsdaten</h2>
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
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Zielgruppenanalyse</h2>
        <p className="text-sm text-white/60">Fragebogen folgt in Kürze.</p>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Verträge, Angebote & Dokumente</h2>
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
                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium"
                  >
                    Herunterladen
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
