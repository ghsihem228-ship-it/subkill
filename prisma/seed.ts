import { seedCatalog } from "../src/lib/seed"
import { db } from "../src/lib/db"

seedCatalog()
  .then(async () => {
    const count = await db.subscription.count()
    console.log(`Seeded ${count} subscriptions (all undetected).`)
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
