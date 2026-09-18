'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DocumentScanner from '@/components/DocumentScanner'
import InvoiceRow, { type Invoice } from '@/components/InvoiceRow'

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
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [scannerMode, setScannerMode] = useState<'new' | 'replace' | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)

  const [months, setMonths] = useState<MonthGroup[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchInvoiceMonths() {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_date, title, file_url')
      .order('invoice_date', { ascending: false })

    const invoices = await Promise.all(
      (data ?? []).map(async (row) => {
        const [{ data: viewSigned }, { data: downloadSigned }] = await Promise.all([
          supabase.storage.from('invoices').createSignedUrl(row.file_url, 60 * 60),
          supabase.storage.from('invoices').createSignedUrl(row.file_url, 60 * 60, { download: true }),
        ])
        return {
          ...row,
          viewUrl: viewSigned?.signedUrl ?? null,
          downloadUrl: downloadSigned?.signedUrl ?? null,
        }
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
      title: title.trim() || null,
      file_url: path,
    })

    setLoading(false)

    if (insertError) {
      setError('Datei wurde hochgeladen, aber der Eintrag konnte nicht gespeichert werden.')
      return
    }

    setSuccess(true)
    setFile(null)
    setTitle('')
    fetchInvoiceMonths().then(setMonths)
  }

  async function handleReplace(invoiceId: string, newFile: File) {
    const { data: existing } = await supabase.from('invoices').select('file_url').eq('id', invoiceId).single()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !existing) return

    const path = `${user.id}/${Date.now()}-${newFile.name}`
    const { error: uploadError } = await supabase.storage.from('invoices').upload(path, newFile)
    if (uploadError) return

    const { error: updateError } = await supabase.from('invoices').update({ file_url: path }).eq('id', invoiceId)
    if (!updateError) {
      await supabase.storage.from('invoices').remove([existing.file_url])
    }

    fetchInvoiceMonths().then(setMonths)
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      {scannerMode && (
        <DocumentScanner
          onCapture={(capturedFile) => {
            if (scannerMode === 'replace' && replacingId) {
              handleReplace(replacingId, capturedFile)
            } else {
              setFile(capturedFile)
            }
            setScannerMode(null)
            setReplacingId(null)
          }}
          onCancel={() => {
            setScannerMode(null)
            setReplacingId(null)
          }}
        />
      )}

      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-1 mt-4 text-2xl font-light">Buchhaltung</h1>
      <p className="mb-6 text-sm text-white/70">
        Rechnung mit der Kamera scannen (Kanten werden automatisch erkannt und
        zurechtgeschnitten) und nach Monat ablegen.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Bezeichnung</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Tankstelle, Bürobedarf..."
            className="mt-1 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-white placeholder:text-white/40"
          />
        </div>

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
          <label htmlFor="invoice-file" className="block text-sm font-medium">
            Rechnung
          </label>
          <button
            type="button"
            onClick={() => setScannerMode('new')}
            className="mt-1 flex w-full items-center truncate rounded-full border-none bg-[var(--field)] px-5 py-3 text-left text-white"
          >
            {file ? file.name : 'Rechnung scannen...'}
          </button>
          <label htmlFor="invoice-file" className="mt-1 block cursor-pointer text-xs text-white/50 underline">
            ...oder Datei manuell auswählen
          </label>
          <input
            id="invoice-file"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="sr-only"
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
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    onReplace={(invoiceId) => {
                      setReplacingId(invoiceId)
                      setScannerMode('replace')
                    }}
                    onChanged={() => fetchInvoiceMonths().then(setMonths)}
                  />
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
