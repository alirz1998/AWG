'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { NavItem } from '@/lib/navigation'
import LogoutButton from '@/components/LogoutButton'

export default function NavMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
        className="flex h-10 w-14 items-center justify-center rounded-full bg-[var(--card)] shadow-sm"
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
        <div className="absolute top-14 z-20 w-64 rounded-3xl bg-[var(--card)] p-4 shadow-lg">
          <nav className="flex flex-col items-center gap-1 text-center">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="w-full rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-black/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 border-t border-white/10 pt-3 text-center">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  )
}
