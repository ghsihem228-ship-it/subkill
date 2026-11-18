import { createRequire } from 'module'
import type { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// The dev server loads @prisma/client through Node's require cache, which
// keeps the copy generated at server start. When the schema gains a new model
// (e.g. Notification), that cached copy is stale, so we detect a missing
// model, purge the Prisma entries from the require cache and reload the
// freshly generated client from disk.
function loadPrismaClient(): PrismaClient {
  const req = createRequire(process.cwd() + '/package.json') as NodeRequire & {
    cache: Record<string, NodeModule>
  }
  if (req.cache) {
    for (const key of Object.keys(req.cache)) {
      if (key.includes('.prisma') || key.includes('@prisma')) {
        delete req.cache[key]
      }
    }
  }
  const fresh = req('@prisma/client') as typeof import('@prisma/client')
  return new fresh.PrismaClient({
    log: ['query'],
  })
}

const cached = globalForPrisma.prisma
const isFresh = cached !== undefined && cached.notification !== undefined

export const db = isFresh ? cached : loadPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
