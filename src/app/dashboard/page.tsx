import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

const ROLE_LABELS: Record<string, string> = {
  geschaeftsfuehrer: 'Geschäftsführer',
  inhaber: 'Inhaber',
  marketingabteilung: 'Marketingabteilung',
  ansprechperson: 'Ansprechperson',
  awg_team: 'AWG Team',
  awg_admin: 'AWG Admin',
}

const SERVICE_LABELS: Record<string, string> = {
  social_media: 'Social Media Betreuung',
  webdesign: 'Webdesign',
  druckprodukte: 'Druckprodukte',
  grafikdesign: 'Grafikdesign',
  foto_video: 'Foto & Video',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  angebot: 'Angebot',
  vertrag: 'Vertrag',
  rechnung: 'Rechnung',
  dokument: 'Dokument',
}

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

  if (isStaff) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Willkommen, {user.email}</h1>
          <LogoutButton />
        </div>
        <p className="mb-6 text-sm text-gray-500">Du bist als AWG-Team eingeloggt.</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/einladungen"
            className="inline-block rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white"
          >
            Neuen Kunden einladen
          </a>
          <a
            href="/admin/zugangsdaten"
            className="inline-block rounded-md border px-4 py-2 text-sm font-medium"
          >
            Zugangsdaten hinterlegen
          </a>
          <a
            href="/admin/dokumente"
            className="inline-block rounded-md border px-4 py-2 text-sm font-medium"
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
        <p className="text-sm text-gray-500">
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

  const { data: credentials } = await supabase.rpc('get_credentials', {
    p_project_id: project.id,
  }) as { data: { platform_name: string; login: string | null; password: string | null; notes: string | null }[] | null }

  const { data: documents } = await supabase
    .from('documents')
    .select('id, doc_type, file_url, uploaded_at')
    .eq('project_id', project.id)
    .order('uploaded_at', { ascending: false })

  const documentsWithLinks = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_url, 60 * 60)
      return { ...doc, downloadUrl: signed?.signedUrl ?? null }
    })
  )

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm text-gray-500">{project.companies.name}</p>
        <LogoutButton />
      </div>
      <h1 className="mb-1 text-xl font-semibold">
        {SERVICE_LABELS[project.service_type] ?? project.service_type}
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        Deine Rolle: {ROLE_LABELS[firstProject.role] ?? firstProject.role}
      </p>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Zugangsdaten</h2>
        {!credentials || credentials.length === 0 ? (
          <p className="text-sm text-gray-400">
            Noch keine Zugangsdaten hinterlegt.
          </p>
        ) : (
          <ul className="space-y-2">
            {credentials.map((c, i) => (
              <li key={i} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{c.platform_name}</p>
                {c.login && <p className="text-gray-500">Login: {c.login}</p>}
                {c.password && <p className="text-gray-500">Passwort: {c.password}</p>}
                {c.notes && <p className="text-gray-500">{c.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Zielgruppenanalyse</h2>
        <p className="text-sm text-gray-400">Fragebogen folgt in Kürze.</p>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Verträge, Angebote & Dokumente</h2>
        {documentsWithLinks.length === 0 ? (
          <p className="text-sm text-gray-400">Noch kein Dokument hinterlegt.</p>
        ) : (
          <ul className="space-y-2">
            {documentsWithLinks.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                  </p>
                  <p className="text-gray-400">
                    {new Date(doc.uploaded_at).toLocaleDateString('de-AT')}
                  </p>
                </div>
                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    className="rounded-md border px-3 py-1.5 text-sm font-medium"
                  >
                    Herunterladen
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
