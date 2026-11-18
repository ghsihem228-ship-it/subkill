# SubKill — The Subscription Killer

SubKill links bank/email/app-store accounts, detects every recurring charge, scores how hard each one is to cancel, and finishes the kill through guided step-by-step workflows, AI-generated letters, and an AI cancellation strategist chat ("Reaper").

## Tech stack

- Next.js 16 (App Router) + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- Prisma ORM + SQLite (`db/custom.db` — included, with demo data)
- Zustand (client state) + TanStack Query (server state) + next-intl (EN/FR/AR with RTL)
- AI chat/letters: `z-ai-web-dev-sdk` (has graceful fallback replies if unavailable)

## Run it (VS Code)

Prerequisites: [Bun](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`) — or Node 20+ with npm (swap `bun` for `npm` / `npx` below).

```bash
bun install          # install dependencies
bun run db:generate  # generate the Prisma client (db/custom.db already has data)
bun run dev          # start on http://localhost:3000
```

Optional:

```bash
bun run db:push      # re-create/reset the SQLite schema (accepts data loss)
bun run db:seed      # re-seed demo data
bun run lint         # ESLint
```

The database path is portable: `.env` uses `DATABASE_URL="file:../db/custom.db"`, resolved relative to `prisma/schema.prisma`, so the project runs from any folder.

## Project map

```
prisma/schema.prisma   Data models (Account, Transaction, Subscription, CancelStep, Cancellation, Letter, Notification)
db/custom.db           SQLite database (demo data included)
src/app/               Routes — page.tsx (the app), layout.tsx (metadata), api/* (REST endpoints)
src/components/subtract/  App UI (header, dashboard, subscriptions, cancel lab, letters, chat)
src/locales/           en.json / fr.json / ar.json translations
src/lib/               catalog (subscription data + cancel workflows), store, api client, i18n
agent-ctx/             Design specs (SPEC.md) — the shared build contract
```

## Android Studio notes

This is a Next.js web application, not a native Android project — Android Studio has no Gradle project to build here. Typical setups:

- Open this folder in VS Code for development; use Android Studio only if you wrap the app later.
- To ship it to Android, wrap the deployed site as a **Trusted Web Activity (TWA)** in a small Gradle shell project, or use **Capacitor** (`npx cap add android`) pointing at the served URL.
- The UI is fully responsive (mobile-first, RTL-safe) and already works in Android WebView/TWA as-is.

## AI chat caveat

`/api/chat` and `/api/letters` call `z-ai-web-dev-sdk`. Outside the sandbox where that SDK is unavailable, both routes return authored fallback content instead of failing — every other feature is fully local.
