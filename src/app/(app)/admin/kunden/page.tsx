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
      <div className="mb-6 mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-light">Kunden</h1>
        <Link
          href="/admin/kunden/neu"
          className="rounded-full bg-[var(--field)] px-4 py-2 text-sm font-medium text-white transition active:scale-95 active:brightness-90"
        >
          + Kunde hinzufügen
        </Link>
      </div>

      {!companies || companies.length === 0 ? (
        <p className="text-sm text-white/60">Noch keine Kunden angelegt.</p>
      ) : (
        <ul className="space-y-2">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/kunden/${c.id}`}
                className="block rounded-2xl bg-[var(--card)] p-4 text-sm transition active:scale-[0.98] hover:brightness-110 active:brightness-95"
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
