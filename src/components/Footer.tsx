export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-8 py-6 text-sm text-white/70">
        <a href="https://awgit.at" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          AWG Website
        </a>
        <a href="https://awgit.at/kontact" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Kontakt
        </a>
        <a
          href="https://awgit.at/impressum"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white"
        >
          Impressum
        </a>
        <a
          href="https://awgit.at/datenschutzerklaerung"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white"
        >
          Datenschutzerklärung
        </a>
      </div>
      <div className="flex justify-center pb-8">
        <a
          href="#top"
          aria-label="Nach oben"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white"
        >
          ↑
        </a>
      </div>
    </footer>
  )
}
