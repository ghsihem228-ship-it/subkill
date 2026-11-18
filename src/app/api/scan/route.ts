import { db } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { runScan } from "@/lib/seed"

export async function POST() {
  try {
    const { detected, totalMonthly } = await runScan()

    if (detected.length > 0) {
      try {
        await createNotification("detection", `detection:${Date.now()}`, {
          count: String(detected.length),
          monthly: totalMonthly.toFixed(2),
        })
      } catch (notificationError) {
        console.error("Detection notification hook failed", notificationError)
      }
    }

    const [accountRows, accounts, transactions, subscriptions] = await Promise.all([
      db.account.findMany(),
      db.account.count(),
      db.transaction.count(),
      db.subscription.count({ where: { status: { in: ["active", "canceling"] } } }),
    ])
    const typeBySourceName = new Map(accountRows.map((a) => [a.name, a.type]))
    return Response.json({
      detected: detected.map((d) => ({
        ...d,
        source: typeBySourceName.get(d.source) ?? "bank",
        sourceName: d.source,
      })),
      totalMonthly,
      counts: { accounts, transactions, subscriptions },
    })
  } catch (error) {
    console.error("POST /api/scan failed", error)
    return Response.json({ error: "Scan failed" }, { status: 500 })
  }
}
