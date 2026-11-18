import { db } from "@/lib/db"
import { monthlyNormalized } from "@/lib/catalog"

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const subs = await db.subscription.findMany({
      where: { status: { not: "undetected" } },
      orderBy: { nextCharge: "asc" },
    })

    const billed = subs.filter((s) => s.status === "active" || s.status === "canceling")
    const canceled = subs.filter((s) => s.status === "canceled")

    const monthlySpend = billed.reduce((sum, s) => sum + monthlyNormalized(s.amount, s.cadence), 0)
    const savedMonthly = canceled.reduce((sum, s) => sum + monthlyNormalized(s.amount, s.cadence), 0)
    const potentialMonthly = billed
      .filter((s) => s.difficulty >= 6)
      .reduce((sum, s) => sum + monthlyNormalized(s.amount, s.cadence), 0)

    const byCategoryMap = new Map<string, number>()
    for (const s of billed) {
      const key = s.category
      byCategoryMap.set(key, (byCategoryMap.get(key) ?? 0) + monthlyNormalized(s.amount, s.cadence))
    }
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)

    const now = Date.now()
    const upcoming = billed.slice(0, 8).map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
      icon: s.icon,
      date: s.nextCharge.toISOString(),
      daysUntil: Math.ceil((s.nextCharge.getTime() - now) / DAY_MS),
    }))

    return Response.json({
      monthlySpend: Math.round(monthlySpend * 100) / 100,
      annualSpend: Math.round(monthlySpend * 12 * 100) / 100,
      activeCount: billed.length,
      hardCount: billed.filter((s) => s.difficulty >= 6).length,
      canceledCount: canceled.length,
      savedMonthly: Math.round(savedMonthly * 100) / 100,
      savedAnnual: Math.round(savedMonthly * 12 * 100) / 100,
      potentialMonthly: Math.round(potentialMonthly * 100) / 100,
      byCategory,
      upcoming,
    })
  } catch (error) {
    console.error("GET /api/stats failed", error)
    return Response.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
