import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'

export default async function KalenderAboPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  let { data: tokenRow } = await supabase
    .from('calendar_feed_tokens')
    .select('token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tokenRow) {
    const { data: created } = await supabase
      .from('calendar_feed_tokens')
      .insert({ user_id: user.id })
      .select('token')
      .single()
    tokenRow = created
  }

  const host = (await headers()).get('host')
  const feedUrl = `https://${host}/api/kalender/${tokenRow?.token}`
  const webcalUrl = feedUrl.replace('https://', 'webcal://')

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Kalender abonnieren</h1>
      <p className="mb-6 text-sm text-white/70">
        Alle Deadlines, Termine und Meetings automatisch in deinem eigenen Kalender (z. B.
        Apple Kalender) sehen. Neue Einträge in der App erscheinen dort von selbst, ohne dass
        du irgendwas exportieren musst — dein Kalender holt sich die Updates von selbst ab
        (meist alle paar Stunden, das steuert dein Handy).
      </p>

      <div className="mb-6 rounded-2xl bg-[var(--card)] p-4">
        <p className="mb-1 text-sm font-medium">Dein persönlicher Abo-Link</p>
        <p className="break-all text-sm text-white/70">{feedUrl}</p>
      </div>

      <a
        href={webcalUrl}
        className="mb-6 block w-full rounded-full bg-[var(--field)] px-4 py-3 text-center font-medium text-white transition active:scale-95 active:brightness-90"
      >
        Direkt zum iPhone-Kalender hinzufügen
      </a>

      <div className="space-y-2 text-sm text-white/70">
        <p className="font-medium text-white/90">Falls der Button nichts tut, geht&apos;s auch manuell:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Einstellungen-App → Kalender → Accounts</li>
          <li>&quot;Account hinzufügen&quot; → &quot;Andere&quot;</li>
          <li>&quot;Abonnierten Kalender hinzufügen&quot;</li>
          <li>Den Link oben einfügen (ohne &quot;https://&quot; durch &quot;webcal://&quot; ersetzen)</li>
        </ol>
      </div>

      <p className="mt-6 text-xs text-white/50">
        Der Link ist persönlich und nicht für andere gedacht — wer ihn hat, kann deinen
        Kalender-Feed lesen.
      </p>
    </div>
  )
}
