'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let raf = 0
    const timer = setTimeout(() => {
      const duration = 600
      const start = performance.now()
      function tick(now: number) {
        const progress = Math.min((now - start) / duration, 1)
        setDisplay(Math.round(progress * value))
        if (progress < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [value, delay])

  return <span className="tabular-nums">{display}</span>
}

export default function DashboardCard({
  href,
  icon,
  accent,
  delay = 0,
  badge,
  children,
}: {
  href: string
  icon: React.ReactNode
  accent: string
  delay?: number
  badge?: boolean
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <Link
      href={href}
      className={`relative flex flex-col gap-2 rounded-2xl bg-[var(--card)] p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 active:scale-95 ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {badge && (
        <span className="absolute right-3 top-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
      )}
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${accent}`}>
        {icon}
      </span>
      {children}
    </Link>
  )
}
