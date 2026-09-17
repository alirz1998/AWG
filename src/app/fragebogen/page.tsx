'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { QUESTIONNAIRE_QUESTIONS, type QuestionnaireAnswer } from '@/lib/questionnaire'

export default function FragebogenPage() {
  const supabase = createClient()
  const router = useRouter()

  const [projectId, setProjectId] = useState<string | null>(null)
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

      const { data: roles } = await supabase
        .from('user_project_roles')
        .select('project_id')
        .not('project_id', 'is', null)
        .limit(1)

      const firstProjectId = roles?.[0]?.project_id as string | undefined
      if (!firstProjectId) {
        setLoading(false)
        return
      }
      setProjectId(firstProjectId)

      const { data: rows } = await supabase
        .from('questionnaire_responses')
        .select('question_key, answer')
        .eq('project_id', firstProjectId)

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
  }, [])

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
      <Link href="/dashboard" className="text-sm text-white/60 underline">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="mb-6 mt-4 text-xl font-semibold">Zielgruppenanalyse</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {Object.entries(questionsBySection).map(([sectionLabel, questions]) => (
          <div key={sectionLabel}>
            <h2 className="mb-3 font-medium">{sectionLabel}</h2>
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.key} className="rounded-md border border-white/15 p-4">
                  <p className="mb-2 text-sm font-medium">{q.label}</p>
                  <div className="space-y-1">
                    {q.options.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={q.key}
                          checked={answers[q.key]?.choice === option}
                          onChange={() => setChoice(q.key, option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Ergänzung (optional)"
                    value={answers[q.key]?.zusatz ?? ''}
                    onChange={(e) => setZusatz(q.key, e.target.value)}
                    className="mt-3 w-full rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-gray-900"
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
          className="w-full rounded-md bg-blue-900 px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
