import { db } from "@/lib/db"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const letter = await db.letter.findUnique({ where: { id } })
    if (!letter) {
      return Response.json({ error: "Letter not found" }, { status: 404 })
    }
    await db.letter.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/letters/[id] failed", error)
    return Response.json({ error: "Failed to delete letter" }, { status: 500 })
  }
}
