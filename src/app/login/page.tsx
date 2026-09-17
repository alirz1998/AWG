'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError('E-Mail oder Passwort ist falsch.')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-xl border border-white/15 bg-white/5 p-8 shadow-sm backdrop-blur-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/AWG_logo_weis.png" alt="AWG" className="mx-auto h-10 w-auto" />
        <h1 className="text-xl font-semibold">Anmelden</h1>

        <div>
          <label className="block text-sm font-medium">E-Mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Passwort</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-900 px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Wird geprüft...' : 'Anmelden'}
        </button>
      </form>
    </div>
  )
}
