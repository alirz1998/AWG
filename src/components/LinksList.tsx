import type { ProjectLink } from '@/lib/project-overview'
import DeleteItemButton from '@/components/DeleteItemButton'

export default function LinksList({ links, editable }: { links: ProjectLink[]; editable?: boolean }) {
  if (links.length === 0) {
    return <p className="text-sm text-white/60">Noch keine Links hinterlegt.</p>
  }

  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.id} className="rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
            {link.title}
          </a>
          {editable && <DeleteItemButton table="links" id={link.id} label={link.title} />}
        </li>
      ))}
    </ul>
  )
}
