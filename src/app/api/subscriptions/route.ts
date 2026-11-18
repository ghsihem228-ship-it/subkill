import { loadSubscriptionDTOs } from "@/lib/serialize"

export async function GET() {
  try {
    const subscriptions = await loadSubscriptionDTOs()
    return Response.json({ subscriptions })
  } catch (error) {
    console.error("GET /api/subscriptions failed", error)
    return Response.json({ error: "Failed to load subscriptions" }, { status: 500 })
  }
}
