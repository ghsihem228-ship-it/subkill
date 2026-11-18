import { db } from "@/lib/db"
import { runUpcomingChargeCheck } from "@/lib/notifications"

export async function GET() {
  try {
    // Idempotent upcoming-charge check before returning the list.
    await runUpcomingChargeCheck()

    const [rows, unreadCount] = await Promise.all([
      db.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.notification.count({ where: { read: false } }),
    ])

    return Response.json({
      notifications: rows.map((n) => {
        let params: Record<string, string> = {}
        try {
          params = JSON.parse(n.params) as Record<string, string>
        } catch {
          params = {}
        }
        return {
          id: n.id,
          type: n.type,
          subscriptionId: n.subscriptionId,
          params,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
        }
      }),
      unreadCount,
    })
  } catch (error) {
    console.error("GET /api/notifications failed", error)
    return Response.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { action?: unknown } | null
    if (body?.action !== "read-all") {
      return Response.json({ error: 'action must be "read-all"' }, { status: 400 })
    }
    await db.notification.updateMany({ data: { read: true } })
    return Response.json({ ok: true, unreadCount: 0 })
  } catch (error) {
    console.error("POST /api/notifications failed", error)
    return Response.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.notification.deleteMany()
    return Response.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/notifications failed", error)
    return Response.json({ error: "Failed to clear notifications" }, { status: 500 })
  }
}
