'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Landet hier, nachdem der Nutzer den Bestätigungslink aus der E-Mail
// angeklickt hat. Supabase hat dann bereits eine Session hergestellt,
// wir müssen nur noch die Einladung zuordnen.

export default function BestaetigtPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'lädt' | 'erfolg' | 'fehler'>('lädt')

  useEffect(() => {
    async function run() {
      const supabase = createClient()

      // Kurz warten, bis die Session aus der URL verarbeitet ist
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setStatus('fehler')
        return
      }

      const { error } = await supabase.rpc('accept_invitation', {
        p_token: token,
      })

      if (error) {
        setStatus('fehler')
        return
      }

      setStatus('erfolg')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    }

    run()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-3 rounded-xl border bg-white p-8 text-center shadow-sm">
        {status === 'lädt' && <p>Konto wird bestätigt...</p>}
        {status === 'erfolg' && <p className="text-green-700">Bestätigt! Du wirst weitergeleitet...</p>}
        {status === 'fehler' && (
          <p className="text-red-600">
            Bestätigung fehlgeschlagen. Bitte melde dich normal unter /login an,
            oder frag nach einem neuen Einladungslink.
          </p>
        )}
      </div>
    </div>
  )
}
