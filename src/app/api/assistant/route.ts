import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { STAFF_NAV_ITEMS, getClientNavItems, type NavItem } from '@/lib/navigation'
import { ROLE_LABELS, SERVICE_LABELS } from '@/lib/labels'
import { searchDocumentsAndLinks } from '@/lib/assistant-search'

const MODEL = 'claude-sonnet-5'
const MAX_TOOL_ROUNDS = 4

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { reply: 'Der KI-Assistent ist noch nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' },
      { status: 200 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  const body = (await request.json()) as { messages?: ChatMessage[]; projectId?: string }
  const history = (body.messages ?? []).slice(-10)
  if (history.length === 0) {
    return NextResponse.json({ error: 'Keine Nachricht übermittelt.' }, { status: 400 })
  }

  const { data: roles } = await supabase
    .from('user_project_roles')
    .select('role, project_id, projects(id, service_type, companies(name))')

  const isStaff = roles?.some((r) => r.role === 'awg_admin' || r.role === 'awg_team')
  const projectRoles = (roles ?? []).filter((r) => r.project_id)

  let navItems: NavItem[]
  let searchScope: string[] | null // null = unrestricted (staff), array = only these project ids
  const contextLines: string[] = []

  if (isStaff) {
    navItems = STAFF_NAV_ITEMS
    searchScope = null
    contextLines.push('Der Nutzer ist ein AWG-Team-Mitglied (interner Zugang) und darf Dokumente/Links aller Kunden durchsuchen.')
  } else {
    const selected = body.projectId
      ? projectRoles.find((r) => r.project_id === body.projectId) ?? projectRoles[0]
      : projectRoles[0]

    searchScope = projectRoles.map((r) => r.project_id as string)

    if (!selected) {
      navItems = []
      contextLines.push('Der Nutzer ist noch keinem Projekt zugewiesen.')
    } else {
      const project = selected.projects as unknown as {
        id: string
        service_type: string
        companies: { name: string }
      }
      navItems = getClientNavItems(project.id, project.service_type)
      contextLines.push(
        `Der Nutzer ist Kunde bei "${project.companies.name}", Rolle: ${
          ROLE_LABELS[selected.role] ?? selected.role
        }, Leistung: ${SERVICE_LABELS[project.service_type] ?? project.service_type}.`
      )
      if (projectRoles.length > 1) {
        contextLines.push('Der Nutzer hat mehrere Projekte und kann auf dem Dashboard zwischen ihnen wechseln.')
      }
      contextLines.push('Der Nutzer darf nur Dokumente/Links seiner eigenen Projekte durchsuchen.')
    }
  }

  const pageList = navItems.map((item) => `- "${item.href}": ${item.label} — ${item.description}`).join('\n')

  const systemPrompt = `Du bist der Assistent im Kundenportal von AWG (einer Marketingagentur). Du hilfst Nutzern kurz und freundlich auf Deutsch.

Kontext:
${contextLines.join('\n')}

Verfügbare Seiten:
${pageList || '(keine)'}

Werkzeuge:
- "navigate": Öffnet eine der oben gelisteten Seiten für den Nutzer, wenn seine Anfrage eindeutig dorthin passt.
- "find_documents": Durchsucht hinterlegte Dokumente (Angebote, Verträge, Rechnungen, sonstige Dokumente) und Links anhand eines Suchbegriffs (z.B. Firmenname, Projekt/Leistung, Art des Dokuments, Titel). Nutze dieses Werkzeug, wenn der Nutzer nach einem bestimmten Dokument oder Link fragt oder Informationen dazu sucht.

Regeln:
- Antworte immer kurz (1-3 Sätze) auf Deutsch.
- Wenn eine Nutzeranfrage eindeutig zu einer der verfügbaren Seiten passt, sag kurz Bescheid (z.B. "Klar, ich öffne das für dich.") und rufe danach "navigate" mit dem exakten Pfad auf.
- Wenn der Nutzer nach einem Dokument oder Link sucht, rufe "find_documents" mit einem passenden Suchbegriff auf, bevor du antwortest. Fasse die Treffer verständlich zusammen (Firma, Art/Titel, Datum) und gib die Links/URLs aus den Ergebnissen im Klartext mit an, damit sie anklickbar sind.
- Wenn "find_documents" nichts findet, sag das ehrlich und schlage ggf. vor, den Suchbegriff zu präzisieren.
- Erfinde keine Seiten, Dokumente oder Links, die nicht durch ein Werkzeug bestätigt wurden.
- Wenn nichts passt, beantworte die Frage so gut es geht oder erkläre freundlich, dass du das nicht übernehmen kannst.`

  const anthropic = new Anthropic({ apiKey })

  const tools: Anthropic.Tool[] = []
  if (navItems.length > 0) {
    tools.push({
      name: 'navigate',
      description: 'Öffnet eine bestimmte Seite der App für den Nutzer.',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            enum: navItems.map((item) => item.href),
            description: 'Der exakte Pfad der Seite, die geöffnet werden soll.',
          },
        },
        required: ['path'],
      },
    })
  }
  tools.push({
    name: 'find_documents',
    description: 'Durchsucht Dokumente und Links nach Firmenname, Projekt/Leistung, Dokumentart oder Titel.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Suchbegriff, z.B. Firmenname, Dokumentart oder Stichwort aus dem Titel.',
        },
      },
      required: ['query'],
    },
  })

  const anthropicMessages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let reply = ''
  let navigate: string | null = null

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        tools,
        messages: anthropicMessages,
      })
    } catch {
      return NextResponse.json(
        { reply: 'Der KI-Assistent ist gerade nicht erreichbar. Bitte versuch es später erneut.' },
        { status: 200 }
      )
    }

    for (const block of response.content) {
      if (block.type === 'text') {
        reply += block.text
      }
    }

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    if (toolUseBlocks.length === 0) {
      break
    }

    anthropicMessages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of toolUseBlocks) {
      if (block.name === 'navigate') {
        const input = block.input as { path?: string }
        if (input.path && navItems.some((item) => item.href === input.path)) {
          navigate = input.path
        }
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'ok' })
      } else if (block.name === 'find_documents') {
        const input = block.input as { query?: string }
        const results = await searchDocumentsAndLinks(supabase, input.query ?? '', searchScope)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(results),
        })
      } else {
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'unbekanntes Werkzeug' })
      }
    }

    anthropicMessages.push({ role: 'user', content: toolResults })

    if (response.stop_reason !== 'tool_use') {
      break
    }
  }

  if (!reply) {
    reply = navigate ? 'Ich öffne das für dich.' : 'Entschuldige, dazu habe ich gerade keine Antwort.'
  }

  return NextResponse.json({ reply, navigate })
}
