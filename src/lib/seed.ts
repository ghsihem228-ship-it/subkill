import { db } from "@/lib/db"
import { SUBSCRIPTION_CATALOG, PROVIDERS } from "@/lib/catalog"

const DAY = 24 * 60 * 60 * 1000
const PERIOD_DAYS: Record<string, number> = { monthly: 30.44, yearly: 365 }

// Wipes everything and re-seeds the subscription catalog (steps included).
export async function seedCatalog() {
  await db.letter.deleteMany()
  await db.cancellation.deleteMany()
  await db.chatMessage.deleteMany()
  await db.transaction.deleteMany()
  await db.cancelStep.deleteMany()
  await db.subscription.deleteMany()
  await db.account.deleteMany()

  for (const s of SUBSCRIPTION_CATALOG) {
    await db.subscription.create({
      data: {
        slug: s.slug,
        name: s.name,
        merchant: s.merchant,
        amount: s.amount,
        cadence: s.cadence,
        category: s.category,
        icon: s.icon,
        difficulty: s.difficulty,
        difficultyReason: s.difficultyReason,
        status: "undetected",
        detectedVia: s.detectedVia,
        nextCharge: new Date(Date.now() + s.nextChargeInDays * DAY),
        firstSeen: new Date(Date.now() - 182 * DAY),
        notes: s.notes,
        cancellationMethod: s.cancellationMethod,
        steps: {
          create: s.steps.map((st) => ({
            order: st.order,
            title: st.title,
            description: st.description,
            type: st.type,
            hoop: st.hoop ?? false,
            hoopScript: st.hoopScript ?? null,
            estimatedMinutes: st.estimatedMinutes,
            done: false,
          })),
        },
      },
    })
  }
}

// Connects a (simulated) account and backfills its transaction history.
export async function connectAccount(provider: string) {
  const meta = PROVIDERS[provider]
  if (!meta) throw new Error(`Unknown provider: ${provider}`)

  let account = await db.account.findUnique({ where: { provider } })
  if (account) return { account, created: false, transactionCount: 0 }

  account = await db.account.create({
    data: {
      provider: meta.provider,
      name: meta.name,
      type: meta.type,
      status: "connected",
      maskedRef: meta.maskedRef,
    },
  })

  const targets = SUBSCRIPTION_CATALOG.filter((s) => s.detectedVia === meta.type)
  let transactionCount = 0

  for (const s of targets) {
    const period = PERIOD_DAYS[s.cadence] ?? 30
    const lastChargeDaysAgo = Math.max(s.nextChargeInDays - period, 5)
    const count = s.cadence === "yearly" ? 2 : 6

    for (let i = 0; i < count; i++) {
      const daysAgo = lastChargeDaysAgo + i * period
      const desc =
        meta.type === "bank"
          ? `Card purchase - ${s.merchant}`
          : meta.type === "email"
            ? `Email receipt from ${s.name}`
            : `App Store purchase - ${s.name}`
      await db.transaction.create({
        data: {
          accountId: account.id,
          merchant: s.merchant,
          merchantKey: s.slug,
          amount: s.amount,
          date: new Date(Date.now() - daysAgo * DAY),
          description: desc,
        },
      })
      transactionCount++
    }
  }

  return { account, created: true, transactionCount }
}

// Detection engine: groups transactions by merchant key, detects recurring
// cadence patterns, and activates matching catalog subscriptions.
export async function runScan() {
  const transactions = await db.transaction.findMany()
  const accounts = await db.account.findMany()
  const byKey = new Map<string, typeof transactions>()
  for (const t of transactions) {
    const list = byKey.get(t.merchantKey) ?? []
    list.push(t)
    byKey.set(t.merchantKey, list)
  }

  const detected: { slug: string; name: string; amount: number; cadence: string; source: string; occurrences: number }[] = []
  let totalMonthly = 0

  for (const [key, txns] of byKey) {
    const sub = await db.subscription.findUnique({ where: { slug: key } })
    if (!sub || sub.status !== "undetected") continue

    // Catalog-verified merchant: 3+ occurrences for monthly, 1+ for yearly.
    const minCount = sub.cadence === "yearly" ? 1 : 3
    if (txns.length < minCount) continue

    const account = accounts.find((a) => a.id === txns[0].accountId)
    const source = account?.name ?? "Linked account"

    await db.subscription.update({
      where: { id: sub.id },
      data: {
        status: "active",
        transactions: { connect: txns.map((t) => ({ id: t.id })) },
      },
    })

    const monthly = sub.cadence === "yearly" ? sub.amount / 12 : sub.amount
    totalMonthly += monthly
    detected.push({
      slug: sub.slug,
      name: sub.name,
      amount: sub.amount,
      cadence: sub.cadence,
      source,
      occurrences: txns.length,
    })
  }

  detected.sort((a, b) => b.amount - a.amount)
  return { detected, totalMonthly }
}
