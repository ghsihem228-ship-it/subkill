import { db } from "@/lib/db"
import { loadSubscriptionDTO, serializeTransaction } from "@/lib/serialize"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const subscription = await loadSubscriptionDTO(id)
    if (!subscription) {
      return Response.json({ error: "Subscription not found" }, { status: 404 })
    }

    const transactions = await db.transaction.findMany({
      where: { subscriptionId: id },
      orderBy: { date: "desc" },
      include: { account: true },
    })

    return Response.json({
      subscription,
      transactions: transactions.map(serializeTransaction),
    })
  } catch (error) {
    console.error("GET /api/subscriptions/[id] failed", error)
    return Response.json({ error: "Failed to load subscription" }, { status: 500 })
  }
}
