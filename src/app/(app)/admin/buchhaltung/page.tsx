'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Invoice = {
  id: string
  invoice_date: string
  file_url: string
  viewUrl: string | null
}

type MonthGroup = {
  key: string
  label: string
  invoices: Invoice[]
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function monthLabel(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('de-AT', { month: 'long', year: 'numeric' })
}

function groupByMonth(invoices: Invoice[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>()

  for (const invoice of invoices) {
    const key = invoice.invoice_date.slice(0, 7)
    if (!groups.has(key)) {
      groups.set(key, { key, label: monthLabel(invoice.invoice_date), invoices: [] })
    }
    groups.get(key)!.invoices.push(invoice)
  }

  return Array.from(groups.values()).sort((a, b) => (a.key < b.key ? 1 : -1))
}

export default function AdminBuchhaltungPage() {
  const supabase = createClient()

  const [invoiceDate, setInvoiceDate] = useState(todayIso())
  const [file, setFile] = useState<File | null>(null)

  const [months, setMonths] = useState<MonthGroup[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchInvoiceMonths() {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_date, file_url')
      .order('invoice_date', { ascending: false })

    const invoices = await Promise.all(
      (data ?? []).map(async (row) => {
        const { data: signed } = await supabase.storage.from('invoices').createSignedUrl(row.file_url, 60 * 60)
        return { ...row, viewUrl: signed?.signedUrl ?? null }
      })
    )

    return groupByMonth(invoices)
  }

  useEffect(() => {
    fetchInvoiceMonths().then((grouped) => {
      setMonths(grouped)
      setLoadingList(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setError('Bitte neu einloggen.')
      return
    }

    // Dateipfad beginnt mit der User-ID, damit Storage-Policies wissen,
    // wem die Rechnung ursprünglich gehört.
    const path = `${user.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('invoices').upload(path, file)

    if (uploadError) {
      setLoading(false)
      setError('Datei konnte nicht hochgeladen werden.')
      return
    }

    const { error: insertError } = await supabase.from('invoices').insert({
      uploaded_by: user.id,
      invoice_date: invoiceDate,
      file_url: path,
    })

    setLoading(false)

    if (insertError) {
      setError('Datei wurde hochgeladen, aber der Eintrag konnte nicht gespeichert werden.')
      return
    }

    setSuccess(true)
    setFile(null)
    fetchInvoiceMonths().then(setMonths)
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Buchhaltung</h1>
      <p className="mb-6 text-sm text-white/70">
        Rechnung scannen und nach Monat ablegen. Am Handy einfach die Datei wählen und die
        &bdquo;Dokument scannen&rdquo;-Option nutzen.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Rechnungsdatum</label>
          <input
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Rechnung</label>
          <input
            type="file"
            required
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">Hochgeladen!</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white transition active:scale-95 active:brightness-90 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'Wird hochgeladen...' : 'Hochladen'}
        </button>
      </form>

      <h2 className="mb-3 mt-10 text-lg font-light">Abgelegte Rechnungen</h2>

      {loadingList ? (
        <p className="text-sm text-white/60">Wird geladen...</p>
      ) : months.length === 0 ? (
        <p className="text-sm text-white/60">Noch keine Rechnung hinterlegt.</p>
      ) : (
        <div className="space-y-4">
          {months.map((month, index) => (
            <details key={month.key} className="group" open={index === 0}>
              <summary className="mb-2 cursor-pointer list-none text-sm font-medium text-white/70 marker:content-none">
                <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
                {month.label} ({month.invoices.length})
              </summary>
              <ul className="space-y-2">
                {month.invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[var(--surface)] p-3 text-sm"
                  >
                    <p className="text-white/80">
                      {new Date(invoice.invoice_date).toLocaleDateString('de-AT')}
                    </p>
                    {invoice.viewUrl && (
                      <a
                        href={invoice.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium"
                      >
                        Anzeigen
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
