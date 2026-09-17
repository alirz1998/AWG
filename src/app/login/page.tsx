'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Alle Kacheln sitzen bewusst nur im oberen/unteren Rand-Bereich (nie auf
// mittlerer Höhe), damit sie auf schmalen Bildschirmen nicht mit der
// zentrierten Karte kollidieren, aber trotzdem auf jeder Breite sichtbar sind.
const HERO_PHOTOS = [
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a46402839cc914db6885384_DSC01365.jpg', className: 'left-[2%] top-[6%] h-16 w-16 -rotate-6 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a3951cd9c22ef2951f5030e_4.jpg', className: 'left-[18%] top-[2%] h-16 w-16 rotate-4 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a3951ce040ed9bfa8b1a00d_DSC02189.jpg', className: 'left-1/2 top-[3%] h-16 w-16 -translate-x-1/2 -rotate-3 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a3951cd6de84f74aaef4118_15102025-8.jpg', className: 'right-[18%] top-[2%] h-16 w-16 rotate-3 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a46411c43ae5760d4208d3d_0X4A1629-web.jpg', className: 'right-[2%] top-[6%] h-16 w-16 -rotate-4 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a3951ce898078759f2406b5_DSC01862.jpg', className: 'left-[6%] bottom-[6%] h-16 w-16 rotate-6 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a3951ce2b75c252fec96c9c_DSC00417.jpg', className: 'left-[22%] bottom-[2%] h-16 w-16 -rotate-3 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a46411c1f50ce92959582a8_DSC03741-web.jpg', className: 'left-1/2 bottom-[4%] h-16 w-16 -translate-x-1/2 rotate-3 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a46402bd1e5f2f75a57fc3a_0X4A1339.jpg', className: 'right-[22%] bottom-[2%] h-16 w-16 rotate-6 sm:h-24 sm:w-24' },
  { src: 'https://cdn.prod.website-files.com/6a394f413ae07efa829779ee/6a46402af38bfb12c943f1fa_19.jpg', className: 'right-[6%] bottom-[6%] h-16 w-16 -rotate-6 sm:h-24 sm:w-24' },
]

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {HERO_PHOTOS.map((photo) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.src}
          src={photo.src}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-2xl object-cover shadow-lg ${photo.className}`}
        />
      ))}

      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-sm space-y-4 rounded-3xl bg-[var(--card)] p-8 shadow-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/AWG_logo_weis.png" alt="AWG" className="mx-auto h-10 w-auto" />
        <h1 className="text-2xl font-light">Anmelden</h1>

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Wird geprüft...' : 'Anmelden'}
        </button>
      </form>
    </div>
  )
}
