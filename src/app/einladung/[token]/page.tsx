'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Diese Seite nimmt eine Einladung an. Zwei Fälle:
// 1) E-Mail-Bestätigung ist aus (Testbetrieb): Nutzer ist sofort eingeloggt,
//    die Einladung wird direkt zugeordnet.
// 2) E-Mail-Bestätigung ist an: Nutzer muss erst den Link in der Mail
//    anklicken. Der führt zu /einladung/[token]/bestaetigt, wo die
//    Zuordnung dann passiert (siehe dortige Seite).

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { vorname, nachname },
        emailRedirectTo: `${window.location.origin}/einladung/${token}/bestaetigt`,
      },
    })

    if (signUpError || !data.user) {
      setLoading(false)
      setError('Registrierung fehlgeschlagen. Ist die E-Mail schon vergeben?')
      return
    }

    // Wenn sofort eine Session da ist (E-Mail-Bestätigung aus), gleich zuordnen.
    if (data.session) {
      const { error: acceptError } = await supabase.rpc('accept_invitation', {
        p_token: token,
      })

      setLoading(false)

      if (acceptError) {
        setError('Konto wurde erstellt, aber die Einladung konnte nicht zugeordnet werden.')
        return
      }

      window.location.href = '/dashboard'
      return
    }

    // Sonst: Nutzer muss erst die E-Mail bestätigen.
    setLoading(false)
    setAwaitingConfirmation(true)
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-3 rounded-3xl bg-[var(--card)] p-8 text-center shadow-sm">
          <h1 className="text-2xl font-light">Fast geschafft</h1>
          <p className="text-sm text-white/70">
            Wir haben dir eine E-Mail geschickt. Klick auf den Bestätigungslink darin,
            danach bist du automatisch deinem Projekt zugeordnet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm space-y-4 rounded-3xl bg-[var(--card)] p-8 shadow-sm"
      >
        <h1 className="text-2xl font-light">Willkommen bei AWG</h1>
        <p className="text-sm text-white/70">
          Leg dein Konto an, um mit dem Onboarding zu starten.
        </p>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium">Vorname</label>
            <input
              type="text"
              required
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
              className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Nachname</label>
            <input
              type="text"
              required
              value={nachname}
              onChange={(e) => setNachname(e.target.value)}
              className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">E-Mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Passwort</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white transition active:scale-95 active:brightness-90 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'Wird angelegt...' : 'Konto erstellen'}
        </button>
      </form>
    </div>
  )
}
