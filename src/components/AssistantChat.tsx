'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const URL_REGEX = /(https?:\/\/[^\s)]+)/g
const URL_REGEX_TEST = /^https?:\/\/[^\s)]+$/

function renderWithLinks(content: string) {
  const parts = content.split(URL_REGEX)
  return parts.map((part, i) =>
    URL_REGEX_TEST.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-white"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function AssistantChat({
  projectId,
  greeting,
}: {
  projectId?: string
  greeting: string
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: greeting }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, projectId }),
      })
      const data = await res.json()

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      }
      if (data.navigate) {
        setTimeout(() => router.push(data.navigate), 700)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Da ist etwas schiefgelaufen. Bitte versuch es erneut.' },
      ])
    } finally {
      setLoading(false)
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col rounded-3xl bg-[var(--card)] shadow-sm">
      <div ref={scrollRef} className="flex max-h-[50vh] min-h-[240px] flex-col gap-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-[var(--field)] text-white'
                : 'mr-auto bg-black/15 text-white'
            }`}
          >
            {renderWithLinks(m.content)}
          </div>
        ))}
        {loading && (
          <div className="mr-auto max-w-[85%] rounded-2xl bg-black/15 px-4 py-2.5 text-sm text-white/60">
            …
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Wobei kann ich helfen?"
          className="flex-1 rounded-full border-none bg-[var(--field)] px-4 py-2.5 text-sm text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-[var(--field)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Senden
        </button>
      </form>
    </div>
  )
}
