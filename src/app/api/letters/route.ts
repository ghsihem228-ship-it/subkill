import { db } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { serializeLetter } from "@/lib/serialize"
import {
  LETTER_TEMPLATES,
  buildFallbackLetter,
  isLetterTemplateType,
  letterTitle,
} from "@/lib/letter-templates"

const LETTER_TIMEOUT_MS = 45_000

function resolveLocale(value: unknown): "en" | "fr" | "ar" {
  return value === "fr" || value === "ar" ? value : "en"
}

function localePromptSuffix(locale: "en" | "fr" | "ar"): string {
  if (locale === "fr") return " Write your entire response in French."
  if (locale === "ar") return " Write your entire response in Arabic."
  return ""
}

const LETTER_SYSTEM_PROMPT = `You are a professional paralegal letter writer. You draft consumer cancellation, dispute and complaint letters that are firm, precise and factually grounded. Output ONLY the letter body in plain text — no preamble, no commentary, no markdown, no explanation before or after the letter.

The letter must be addressed to the recipient's cancellation or billing department and must reference: the subscription name, the account holder placeholder [Your Name], the masked account reference [Acct ••••], the merchant name, the monthly amount, today's date written as the placeholder [Today's Date], and the demand being made. The demand must state that the subscription is canceled effective at the end of the current billing period, request written confirmation within a specific number of days, and state the intent to dispute the charge, file a chargeback, or escalate to the state attorney general if the demand is ignored.

Keep the letter under 350 words. Use standard business-letter formatting: date line, recipient block, RE line, salutation, body paragraphs, closing, signature block. Use the placeholders [Your Name], [Acct ••••] and [Today's Date] exactly where the sender's real details would go.`

async function generateWithLLM(
  subscriptionName: string,
  merchant: string,
  amount: number,
  cadence: string,
  templateType: string,
  locale: "en" | "fr" | "ar"
): Promise<string> {
  const { default: ZAI } = await import("z-ai-web-dev-sdk")
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: LETTER_SYSTEM_PROMPT + localePromptSuffix(locale) },
      {
        role: "user",
        content: `Write a ${LETTER_TEMPLATES[templateType as keyof typeof LETTER_TEMPLATES].label} letter for the following subscription. Template purpose: ${LETTER_TEMPLATES[templateType as keyof typeof LETTER_TEMPLATES].description}.

Subscription name: ${subscriptionName}
Merchant: ${merchant}
Amount: $${amount.toFixed(2)} per ${cadence === "yearly" ? "year" : "month"}

Output only the letter body.`,
      },
    ],
    thinking: { type: "disabled" },
  })
  return completion.choices[0]?.message?.content ?? ""
}

export async function GET() {
  try {
    const letters = await db.letter.findMany({
      orderBy: { createdAt: "desc" },
      include: { subscription: true },
    })
    return Response.json({ letters: letters.map(serializeLetter) })
  } catch (error) {
    console.error("GET /api/letters failed", error)
    return Response.json({ error: "Failed to load letters" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      subscriptionId?: unknown
      templateType?: unknown
      locale?: unknown
    } | null

    const subscriptionId = body?.subscriptionId
    const templateType = body?.templateType
    const locale = resolveLocale(body?.locale)
    if (typeof subscriptionId !== "string" || !subscriptionId) {
      return Response.json({ error: "subscriptionId is required" }, { status: 400 })
    }
    if (!isLetterTemplateType(templateType)) {
      return Response.json(
        {
          error:
            "Invalid templateType. Expected cancellation_demand, certified_mail, chargeback or ag_complaint.",
        },
        { status: 400 }
      )
    }

    const subscription = await db.subscription.findUnique({ where: { id: subscriptionId } })
    if (!subscription) {
      return Response.json({ error: "Subscription not found" }, { status: 404 })
    }

    let content = ""
    try {
      const llmContent = await Promise.race([
        generateWithLLM(
          subscription.name,
          subscription.merchant,
          subscription.amount,
          subscription.cadence,
          templateType,
          locale
        ),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), LETTER_TIMEOUT_MS)),
      ])
      if (typeof llmContent === "string" && llmContent.trim().length > 0) {
        content = llmContent.trim()
      }
    } catch (error) {
      console.error("Letter LLM generation failed, using fallback", error)
    }

    if (!content) {
      content = buildFallbackLetter(templateType, subscription)
    }

    const letter = await db.letter.create({
      data: {
        subscriptionId: subscription.id,
        templateType,
        title: letterTitle(templateType, subscription.name),
        content,
      },
      include: { subscription: true },
    })

    try {
      await createNotification("letter_generated", `letter:${letter.id}`, {
        title: letter.title,
      }, letter.subscriptionId)
    } catch (notificationError) {
      console.error("Letter-generated notification hook failed", notificationError)
    }

    return Response.json({ letter: serializeLetter(letter) })
  } catch (error) {
    console.error("POST /api/letters failed", error)
    return Response.json({ error: "Failed to generate letter" }, { status: 500 })
  }
}
