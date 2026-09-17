import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SERVICE_LABELS } from '@/lib/labels'

type ProjectRow = {
  id: string
  service_type: string
  status: string
  companies: { name: string } | { name: string }[]
}

export default async function AdminProjektePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, service_type, status, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-xl font-semibold">Projekte</h1>

      {!projects || projects.length === 0 ? (
        <p className="text-sm text-white/60">Noch keine Projekte angelegt.</p>
      ) : (
        <ul className="space-y-2">
          {(projects as ProjectRow[]).map((p) => {
            const companyName = Array.isArray(p.companies)
              ? p.companies[0]?.name
              : p.companies?.name
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/projekte/${p.id}`}
                  className="block rounded-md border border-white/15 p-3 text-sm hover:bg-white/5"
                >
                  <p className="font-medium">{companyName}</p>
                  <p className="text-white/60">
                    {SERVICE_LABELS[p.service_type] ?? p.service_type} · {p.status}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
