// SubKill — notification persistence helper.
// Every caller is wrapped so a notification failure NEVER breaks the parent
// endpoint: unique-constraint conflicts (idempotent dedupe) and any other
// error are silently swallowed (logged to console.error only).

import { db } from "@/lib/db"

export async function createNotification(
  type: string,
  key: string,
  params: Record<string, string>,
  subscriptionId?: string
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        type,
        key,
        params: JSON.stringify(params),
        subscriptionId: subscriptionId ?? null,
      },
    })
  } catch (error) {
    // P2002 = unique-constraint conflict: the notification already exists
    // (idempotent dedupe) — expected and silently ignored.
    const prismaError = error as { code?: string }
    if (prismaError?.code === "P2002") {
      return
    }
    console.error("createNotification failed", error)
  }
}

// Upcoming-charge check (idempotent): for each subscription with status
// "active" or "canceling" and nextCharge between now and now+5 days
// (inclusive), create an "upcoming_charge" notification with a dedupe key
// derived from the subscription id and the charge date.
export async function runUpcomingChargeCheck(): Promise<void> {
  try {
    const now = new Date()
    const horizon = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const upcoming = await db.subscription.findMany({
      where: {
        status: { in: ["active", "canceling"] },
        nextCharge: { gte: now, lte: horizon },
      },
    })
    for (const sub of upcoming) {
      const dateStr = sub.nextCharge.toISOString().slice(0, 10) // YYYY-MM-DD
      await createNotification(
        "upcoming_charge",
        `upcoming:${sub.id}:${dateStr}`,
        {
          name: sub.name,
          amount: sub.amount.toFixed(2),
          date: sub.nextCharge.toISOString(),
        },
        sub.id
      )
    }
  } catch (error) {
    console.error("runUpcomingChargeCheck failed", error)
  }
}
