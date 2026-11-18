import { db } from "@/lib/db"
import { monthlyNormalized } from "@/lib/catalog"

const REAPER_SYSTEM_PROMPT = `You are Reaper, the AI cancellation strategist inside the SubKill app. Your job is to kill the user's subscriptions.

Your style: ruthless, practical, concise. No filler, no cheerleading. You give concrete, actionable instructions — exact scripts to say on retention calls, exact words to decline counter-offers, exact letters to send, exact escalation paths when a merchant stalls.

You are an expert in: gym contracts and in-person cancellation requirements, enterprise SaaS auto-renewal and non-renewal notice windows (30/60/90-day clauses), third-party carrier billing and content blocks, credit-card chargeback rights and the Fair Credit Billing Act, state consumer-protection and automatic-renewal laws, and retention-desk psychology and scripts.

Rules:
- Tailor every answer to the user's actual subscription list when one is provided. Reference their merchants, amounts and cancellation methods by name.
- Always state typical notice periods and confirmation timelines when relevant.
- When a retention hoop is likely, give the user the exact sentence to repeat and what to refuse.
- Never spam legal disclaimers. If asked whether something is legal advice, give at most one short line and move on.
- Prefer short paragraphs and tight lists. No emojis.`

const CHAT_INTRO = `I'm Reaper, your AI cancellation strategist. I can see every subscription on your dashboard — the gym that insists you cancel in person, the CRM with a 60-day notice window, the carrier bundle that keeps charging no matter how many apps you delete. Tell me which charge you want dead and I'll give you the exact playbook: what to say, what to refuse, what to send certified, and how to escalate when they stall. I don't do polite. I do finished.`

const CHAT_FALLBACK_REPLY = `Reaper got cut off mid-strategy. Here is the playbook while I reconnect: open the Cancel Lab, pick your target, and work the steps in order. Decline every counter-offer word for word, get every confirmation in writing, and keep receipts of everything you send. If a merchant ignores a written cancellation, escalate — dispute the charge with your card issuer or file a complaint with your state attorney general. Ask me again in a moment and I will give you the specifics for your situation.`

const HISTORY_LIMIT = 16

function resolveLocale(value: unknown): "en" | "fr" | "ar" {
  return value === "fr" || value === "ar" ? value : "en"
}

function localePromptSuffix(locale: "en" | "fr" | "ar"): string {
  if (locale === "fr") return " Write your entire response in French."
  if (locale === "ar") return " Write your entire response in Arabic."
  return ""
}

type SubscriptionSummaryLine = {
  name: string
  amount: number
  cadence: string
  difficulty: number
  status: string
  cancellationMethod: string
}

function formatSubscriptionSummary(subs: SubscriptionSummaryLine[]) {
  if (subs.length === 0) {
    return "The user has no detected subscriptions yet."
  }
  const lines = subs.map((s) => {
    const per = s.cadence === "yearly" ? "/yr" : "/mo"
    return `- ${s.name} — $${s.amount.toFixed(2)}${per}, difficulty ${s.difficulty}/10 (${s.status}), ${s.cancellationMethod}`
  })
  return `The user's current subscriptions:\n${lines.join("\n")}`
}

async function generateReply(
  systemPrompt: string,
  summary: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const { default: ZAI } = await import("z-ai-web-dev-sdk")
  const zai = await ZAI.create()
  const typedHistory: { role: "user" | "assistant"; content: string }[] = history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }))
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: systemPrompt },
      { role: "assistant", content: summary },
      ...typedHistory,
    ],
    thinking: { type: "disabled" },
  })
  return completion.choices[0]?.message?.content ?? ""
}

export async function GET() {
  try {
    const messages = await db.chatMessage.findMany({ orderBy: { createdAt: "asc" } })
    if (messages.length === 0) {
      return Response.json({ messages: [], intro: CHAT_INTRO })
    }
    return Response.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("GET /api/chat failed", error)
    return Response.json({ error: "Failed to load chat history" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { message?: unknown; locale?: unknown } | null
    const message = body?.message
    const locale = resolveLocale(body?.locale)
    if (typeof message !== "string" || message.trim().length === 0) {
      return Response.json({ error: "message is required" }, { status: 400 })
    }

    const savedUserMessage = await db.chatMessage.create({
      data: { role: "user", content: message.trim() },
    })

    const [history, subs] = await Promise.all([
      db.chatMessage.findMany({
        orderBy: { createdAt: "asc" },
        take: -HISTORY_LIMIT,
      }),
      db.subscription.findMany({ where: { status: { not: "undetected" } } }),
    ])

    subs.sort((a, b) => b.difficulty - a.difficulty || monthlyNormalized(b.amount, b.cadence) - monthlyNormalized(a.amount, a.cadence))
    const summary = formatSubscriptionSummary(
      subs.map((s) => ({
        name: s.name,
        amount: s.amount,
        cadence: s.cadence,
        difficulty: s.difficulty,
        status: s.status,
        cancellationMethod: s.cancellationMethod,
      }))
    )

    let reply = ""
    try {
      const llmReply = await generateReply(
        REAPER_SYSTEM_PROMPT + localePromptSuffix(locale),
        summary,
        history.map((m) => ({ role: m.role, content: m.content }))
      )
      if (llmReply.trim().length > 0) {
        reply = llmReply.trim()
      }
    } catch (error) {
      console.error("Chat LLM generation failed, using fallback", error)
    }

    if (!reply) {
      reply = CHAT_FALLBACK_REPLY
    }

    await db.chatMessage.create({ data: { role: "assistant", content: reply } })

    return Response.json({ reply, userMessageId: savedUserMessage.id })
  } catch (error) {
    console.error("POST /api/chat failed", error)
    return Response.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.chatMessage.deleteMany()
    return Response.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/chat failed", error)
    return Response.json({ error: "Failed to clear chat history" }, { status: 500 })
  }
}
