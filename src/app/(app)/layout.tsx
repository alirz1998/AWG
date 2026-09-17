import Footer from '@/components/Footer'
import HomeButton from '@/components/HomeButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className="flex min-h-screen flex-col">
      <HomeButton />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}
