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
    .select('id, name, branche')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">Kunden</h1>

      {!companies || companies.length === 0 ? (
        <p className="text-sm text-white/60">Noch keine Kunden angelegt.</p>
      ) : (
        <ul className="space-y-2">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/kunden/${c.id}`}
                className="block rounded-md border border-white/15 p-3 text-sm hover:bg-white/5"
              >
                <p className="font-medium">{c.name}</p>
                {c.branche && <p className="text-white/60">{c.branche}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
