import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SERVICE_LABELS } from '@/lib/labels'
import KundennummerEditor from '@/components/KundennummerEditor'

export default async function AdminKundeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, branche, kundennummer')
    .eq('id', id)
    .single()

  if (!company) {
    notFound()
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, service_type, status')
    .eq('company_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/admin/kunden" className="text-sm text-white/60 underline">
        ← Zurück zu Kunden
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">{company.name}</h1>
      {company.branche && <p className="mb-1 text-sm text-white/60">{company.branche}</p>}
      <div className="mb-6">
        <KundennummerEditor companyId={company.id} initialValue={company.kundennummer} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Projekte</h2>
        <Link
          href={`/admin/projekte/neu?company=${company.id}`}
          className="rounded-full bg-[var(--field)] px-3 py-1.5 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
        >
          + Projekt hinzufügen
        </Link>
      </div>
      {!projects || projects.length === 0 ? (
        <p className="text-sm text-white/60">Noch keine Projekte für diesen Kunden.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/projekte/${p.id}`}
                className="block rounded-2xl bg-[var(--card)] p-4 text-sm transition active:scale-[0.98] hover:brightness-110 active:brightness-95"
              >
                <p className="font-medium">{SERVICE_LABELS[p.service_type] ?? p.service_type}</p>
                <p className="text-white/60">{p.status}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
