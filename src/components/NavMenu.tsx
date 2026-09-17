'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { NavItem } from '@/lib/navigation'
import LogoutButton from '@/components/LogoutButton'

function groupItems(items: NavItem[]): { group: string | null; items: NavItem[] }[] {
  const groups: { group: string | null; items: NavItem[] }[] = []
  for (const item of items) {
    const key = item.group ?? null
    let bucket = groups.find((g) => g.group === key)
    if (!bucket) {
      bucket = { group: key, items: [] }
      groups.push(bucket)
    }
    bucket.items.push(item)
  }
  return groups
}

export default function NavMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const groups = groupItems(items)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative flex justify-center">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
        className="flex h-10 w-14 items-center justify-center rounded-full bg-[var(--card)] shadow-sm transition active:scale-90 active:brightness-90"
      >
        {open ? (
          <span className="text-lg leading-none">✕</span>
        ) : (
          <span className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-14 z-20 max-h-[75vh] w-64 overflow-y-auto rounded-3xl bg-[var(--card)] p-4 shadow-lg">
          <nav className="flex flex-col gap-1 text-center">
            {groups.map((section, i) =>
              section.group ? (
                <details key={section.group} className="group w-full">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium marker:content-none transition active:scale-95 hover:bg-[var(--surface)]">
                    <span>{section.group}</span>
                    <span className="inline-block text-white/40 transition-transform group-open:rotate-90">▸</span>
                  </summary>
                  <div className="flex flex-col items-center gap-1 pb-1 pt-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block w-full rounded-2xl px-4 py-2.5 text-sm font-medium transition active:scale-95 hover:bg-[var(--surface)] active:bg-[var(--surface)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <div key={i} className="flex w-full flex-col items-center gap-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block w-full rounded-2xl px-4 py-2.5 text-sm font-medium transition active:scale-95 hover:bg-[var(--surface)] active:bg-[var(--surface)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )
            )}
          </nav>
          <div className="mt-2 border-t border-white/10 pt-3 text-center">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  )
}
