import { seedCatalog } from "@/lib/seed"

export async function POST() {
  try {
    await seedCatalog()
    return Response.json({ ok: true })
  } catch (error) {
    console.error("POST /api/reset failed", error)
    return Response.json({ error: "Failed to reset data" }, { status: 500 })
  }
}
