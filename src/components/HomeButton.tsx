import Link from 'next/link'
import { HomeIcon } from '@/components/icons'

export default function HomeButton() {
  return (
    <Link
      href="/dashboard"
      aria-label="Zum Dashboard"
      className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] shadow-sm transition active:scale-90 active:brightness-90"
    >
      <HomeIcon className="h-5 w-5" />
    </Link>
  )
}
