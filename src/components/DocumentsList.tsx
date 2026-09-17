import { DOC_TYPE_LABELS } from '@/lib/labels'
import type { DocumentWithLink } from '@/lib/project-overview'

export default function DocumentsList({ documents }: { documents: DocumentWithLink[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-white/60">Noch kein Dokument hinterlegt.</p>
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-3 text-sm"
        >
          <div>
            <p className="font-medium">{DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</p>
            <p className="text-white/60">{new Date(doc.uploaded_at).toLocaleDateString('de-AT')}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {doc.viewUrl && (
              <a
                href={doc.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
              >
                Anzeigen
              </a>
            )}
            {doc.downloadUrl && (
              <a
                href={doc.downloadUrl}
                className="rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
              >
                Herunterladen
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
