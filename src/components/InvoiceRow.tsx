'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Invoice = {
  id: string
  invoice_date: string
  file_url: string
  title: string | null
  viewUrl: string | null
  downloadUrl: string | null
}

export default function InvoiceRow({
  invoice,
  onReplace,
  onChanged,
}: {
  invoice: Invoice
  onReplace: (invoiceId: string) => void
  onChanged: () => void
}) {
  const supabase = createClient()

  const [mode, setMode] = useState<'view' | 'rename' | 'delete'>('view')
  const [titleInput, setTitleInput] = useState(invoice.title ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveRename() {
    setBusy(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ title: titleInput.trim() || null })
      .eq('id', invoice.id)

    setBusy(false)

    if (updateError) {
      setError('Umbenennen fehlgeschlagen.')
      return
    }

    setMode('view')
    onChanged()
  }

  async function handleDelete() {
    setBusy(true)
    setError(null)

    await supabase.storage.from('invoices').remove([invoice.file_url])
    const { error: deleteError } = await supabase.from('invoices').delete().eq('id', invoice.id)

    setBusy(false)

    if (deleteError) {
      setError('Löschen fehlgeschlagen.')
      return
    }

    onChanged()
  }

  const dateLabel = new Date(invoice.invoice_date).toLocaleDateString('de-AT')

  if (mode === 'rename') {
    return (
      <li className="rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm">
        <input
          type="text"
          autoFocus
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder={dateLabel}
          className="w-full rounded-full border-none bg-[var(--field)] px-4 py-2 text-white placeholder:text-white/40"
        />
        {error && <p className="mt-2 text-red-400">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={saveRename}
            disabled={busy}
            className="rounded-full bg-[var(--field)] px-3 py-1.5 font-medium text-white transition active:scale-95 disabled:opacity-50"
          >
            {busy ? 'Speichert...' : 'Speichern'}
          </button>
          <button
            onClick={() => setMode('view')}
            disabled={busy}
            className="rounded-full border border-white/30 px-3 py-1.5 font-medium transition active:scale-95"
          >
            Abbrechen
          </button>
        </div>
      </li>
    )
  }

  if (mode === 'delete') {
    return (
      <li className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm">
        <p className="mb-2 text-red-200">
          &quot;{invoice.title || dateLabel}&quot; wirklich löschen?
        </p>
        {error && <p className="mb-2 text-red-300">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-full bg-red-500/80 px-3 py-1.5 font-medium text-white transition active:scale-95 disabled:opacity-50"
          >
            {busy ? 'Wird gelöscht...' : 'Ja, löschen'}
          </button>
          <button
            onClick={() => setMode('view')}
            disabled={busy}
            className="rounded-full border border-white/30 px-3 py-1.5 font-medium transition active:scale-95"
          >
            Abbrechen
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium text-white/90">{invoice.title || dateLabel}</p>
          {invoice.title && <p className="text-white/60">{dateLabel}</p>}
        </div>
        {invoice.viewUrl && (
          <a
            href={invoice.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
          >
            Anzeigen
          </a>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
        <button onClick={() => setMode('rename')} className="underline">
          Umbenennen
        </button>
        <button onClick={() => onReplace(invoice.id)} className="underline">
          Ersetzen
        </button>
        {invoice.downloadUrl && (
          <a href={invoice.downloadUrl} className="underline">
            Herunterladen
          </a>
        )}
        <button onClick={() => setMode('delete')} className="underline">
          Löschen
        </button>
      </div>
    </li>
  )
}
