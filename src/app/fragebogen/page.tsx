'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { QUESTIONNAIRE_QUESTIONS, type QuestionnaireAnswer } from '@/lib/questionnaire'

function FragebogenForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectParam = searchParams.get('project')

  const [projectId, setProjectId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, QuestionnaireAnswer>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let targetProjectId: string | undefined

      if (projectParam) {
        // AWG-Staff bearbeitet die Zielgruppenanalyse für ein bestimmtes
        // Kundenprojekt (Zugriff wird über RLS geprüft, nicht hier).
        targetProjectId = projectParam

        const { data: project } = await supabase
          .from('projects')
          .select('companies(name)')
          .eq('id', projectParam)
          .single()

        const company = project?.companies as unknown as { name: string } | { name: string }[] | undefined
        setCompanyName(Array.isArray(company) ? company[0]?.name ?? null : company?.name ?? null)
      } else {
        const { data: roles } = await supabase
          .from('user_project_roles')
          .select('project_id')
          .not('project_id', 'is', null)
          .limit(1)

        targetProjectId = roles?.[0]?.project_id as string | undefined
      }

      if (!targetProjectId) {
        setLoading(false)
        return
      }
      setProjectId(targetProjectId)

      const { data: rows } = await supabase
        .from('questionnaire_responses')
        .select('question_key, answer')
        .eq('project_id', targetProjectId)

      const initial: Record<string, QuestionnaireAnswer> = {}
      for (const row of rows ?? []) {
        try {
          initial[row.question_key] = JSON.parse(row.answer ?? '{}')
        } catch {
          initial[row.question_key] = { choice: '', zusatz: '' }
        }
      }
      setAnswers(initial)
      setLoading(false)
    }
    load()
  }, [projectParam])

  function setChoice(key: string, choice: string) {
    setAnswers((prev) => ({ ...prev, [key]: { choice, zusatz: prev[key]?.zusatz ?? '' } }))
  }

  function setZusatz(key: string, zusatz: string) {
    setAnswers((prev) => ({ ...prev, [key]: { choice: prev[key]?.choice ?? '', zusatz } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    const rows = QUESTIONNAIRE_QUESTIONS.map((q) => ({
      project_id: projectId,
      section: q.section,
      question_key: q.key,
      answer: JSON.stringify(answers[q.key] ?? { choice: '', zusatz: '' }),
      updated_at: new Date().toISOString(),
    }))

    const { error: upsertError } = await supabase
      .from('questionnaire_responses')
      .upsert(rows, { onConflict: 'project_id,question_key' })

    setSaving(false)

    if (upsertError) {
      setError('Antworten konnten nicht gespeichert werden.')
      return
    }

    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-white/60">Lädt...</p>
      </div>
    )
  }

  if (!projectId) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-white/70">
          Dein Konto ist noch keinem Projekt zugewiesen.
        </p>
      </div>
    )
  }

  const questionsBySection = QUESTIONNAIRE_QUESTIONS.reduce<Record<string, typeof QUESTIONNAIRE_QUESTIONS>>(
    (acc, q) => {
      ;(acc[q.sectionLabel] ??= []).push(q)
      return acc
    },
    {}
  )

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link
        href={projectParam ? `/admin/projekte/${projectParam}` : '/dashboard'}
        className="text-sm text-white/60 underline"
      >
        ← Zurück
      </Link>
      {companyName && <p className="mt-4 text-sm text-white/70">{companyName}</p>}
      <h1 className="mb-6 mt-1 text-2xl font-light">Zielgruppenanalyse</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {Object.entries(questionsBySection).map(([sectionLabel, questions]) => (
          <div key={sectionLabel}>
            <h2 className="mb-3 font-medium">{sectionLabel}</h2>
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.key} className="rounded-2xl bg-[var(--card)] p-5">
                  <p className="mb-2 text-sm font-medium">{q.label}</p>
                  <select
                    value={answers[q.key]?.choice ?? ''}
                    onChange={(e) => setChoice(q.key, e.target.value)}
                    className="w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-sm text-white placeholder:text-white/40"
                  >
                    <option value="">Bitte wählen...</option>
                    {q.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ergänzung (optional)"
                    value={answers[q.key]?.zusatz ?? ''}
                    onChange={(e) => setZusatz(q.key, e.target.value)}
                    className="mt-3 w-full rounded-full border-none bg-[var(--field)] px-5 py-3 text-sm text-white placeholder:text-white/40"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">Gespeichert!</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--field)] px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}

export default function FragebogenPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl p-8">
          <p className="text-sm text-white/60">Lädt...</p>
        </div>
      }
    >
      <FragebogenForm />
    </Suspense>
  )
}
