import type { Credential } from '@/lib/project-overview'
import DeleteItemButton from '@/components/DeleteItemButton'

export default function CredentialsList({ credentials, editable }: { credentials: Credential[]; editable?: boolean }) {
  if (credentials.length === 0) {
    return <p className="text-sm text-white/60">Noch keine Zugangsdaten hinterlegt.</p>
  }

  return (
    <ul className="space-y-2">
      {credentials.map((c) => (
        <li key={c.id} className="rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm">
          <p className="font-medium">{c.platform_name}</p>
          {c.login && <p className="text-white/70">Login: {c.login}</p>}
          {c.password && <p className="text-white/70">Passwort: {c.password}</p>}
          {c.notes && <p className="text-white/70">{c.notes}</p>}
          {editable && <DeleteItemButton table="credentials" id={c.id} label={c.platform_name} />}
        </li>
      ))}
    </ul>
  )
}
