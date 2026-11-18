import { db } from "@/lib/db"
import { connectAccount } from "@/lib/seed"
import { serializeAccount } from "@/lib/serialize"
import { PROVIDERS } from "@/lib/catalog"

export async function GET() {
  try {
    const accounts = await db.account.findMany({ orderBy: { connectedAt: "asc" } })
    return Response.json({ accounts: accounts.map(serializeAccount) })
  } catch (error) {
    console.error("GET /api/accounts failed", error)
    return Response.json({ error: "Failed to load accounts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { provider?: unknown } | null
    const provider = body?.provider
    if (typeof provider !== "string" || !(provider in PROVIDERS)) {
      return Response.json(
        { error: "Invalid provider. Expected chase, gmail or appstore." },
        { status: 400 }
      )
    }

    const { account, created, transactionCount } = await connectAccount(provider)
    return Response.json({ account: serializeAccount(account), created, transactionCount })
  } catch (error) {
    console.error("POST /api/accounts failed", error)
    return Response.json({ error: "Failed to connect account" }, { status: 500 })
  }
}
