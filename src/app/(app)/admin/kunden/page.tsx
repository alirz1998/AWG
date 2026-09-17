import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminKundenPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, branche, kundennummer')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-light">Kunden</h1>

      {!companies || companies.length === 0 ? (
        <p className="text-sm text-white/60">Noch keine Kunden angelegt.</p>
      ) : (
        <ul className="space-y-2">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/kunden/${c.id}`}
                className="block rounded-2xl bg-[var(--card)] p-4 text-sm transition hover:brightness-110"
              >
                <p className="font-medium">{c.name}</p>
                {c.branche && <p className="text-white/60">{c.branche}</p>}
                <p className="text-white/50">
                  {c.kundennummer ? `Kundennummer: ${c.kundennummer}` : 'Keine Kundennummer vergeben'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
