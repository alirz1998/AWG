import Link from 'next/link'
import { HomeIcon } from '@/components/icons'

export default function HomeButton() {
  return (
    <Link
      href="/dashboard"
      aria-label="Zum Dashboard"
      className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card)] shadow-lg transition active:scale-90 active:brightness-90"
    >
      <HomeIcon className="h-5 w-5" />
    </Link>
  )
}
