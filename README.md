# SubKill — The Subscription Killer

[![Live Web App](https://img.shields.io/badge/Web_App-Live_on_Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://subkill-theta.vercel.app)
[![Download Android APK](https://img.shields.io/badge/Android-Download_APK_(v1.0.0)-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/ghsihem228-ship-it/subkill/releases/latest)

**SubKill** links bank, email, and app-store accounts (`Chase Checking`, `Gmail`, `App Store`), detects every recurring charge, scores how hard each one is to cancel, and finishes the kill through guided step-by-step workflows, AI-generated demand letters, and an AI cancellation strategist chat (**"Reaper"**).

---

## Live Demo & Android Download

- **Web Application:** [Launch SubKill on Vercel](https://subkill-theta.vercel.app)
- **Android App (`v1.0.0`):** [Download `app-release.apk`](https://github.com/ghsihem228-ship-it/subkill/releases/latest) *(Open **Releases → Assets** and install on your Android device)*

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **UI & Styling:** Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- **Database & ORM:** Prisma ORM + PostgreSQL (Neon)
- **State & i18n:** Zustand (client state) + TanStack Query (server state) + `next-intl` (EN / FR / AR with full RTL support)
- **Mobile Runtime:** Capacitor (Native Android Wrapper)
- **AI Engine:** `z-ai-web-dev-sdk` for Reaper chat and cancellation letters (with graceful authored fallback responses when offline/outside sandbox)

---

## Run Locally (VS Code)

Prerequisites: Node.js 20+ (with `npm`) or [Bun](https://bun.sh).

```bash
# 1. Clone the repository
git clone [https://github.com/ghsihem228-ship-it/subkill.git](https://github.com/ghsihem228-ship-it/subkill.git)
cd subkill

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file in the root directory and set your PostgreSQL connection string:
# DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# 4. Generate Prisma client & sync schema
npx prisma generate
npx prisma db push

# 5. Start the development server on http://localhost:3000
npm run dev
```

Optional scripts:

```bash
npm run lint     # Run ESLint
npm run build    # Generate Prisma client, push schema, and build for production
```

---

## Project Map

```text
prisma/schema.prisma       Data models (Account, Transaction, Subscription, CancelStep, Cancellation, Letter, Notification)
src/app/                   Routes — page.tsx (main app), layout.tsx (metadata), api/* (REST endpoints)
src/components/subtract/   App UI (header, dashboard, subscriptions, cancel lab, letters, Reaper chat)
src/locales/               en.json / fr.json / ar.json translations (with RTL layout support)
src/lib/                   Catalog (subscription data + cancel workflows), Zustand store, API client, i18n
android/                   Native Android Studio / Capacitor project
capacitor.config.ts        Capacitor configuration pointing to the live deployment
agent-ctx/                 Design specs (SPEC.md)
```

---

## Android Build & Release

The web app is wrapped as a native Android application via **Capacitor** inside the `android/` directory:

1. Open the `android/` folder in **Android Studio**.
2. To build an unsigned test APK: **`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`**.
3. To build a signed release APK/AAB for distribution or Google Play: **`Build` → `Generate Signed App Bundle or APK...`** using your `.jks` keystore file.

---

## AI Chat & Letters Note

`/api/chat` and `/api/letters` integrate `z-ai-web-dev-sdk`. In environments where the SDK credentials are not configured, both endpoints seamlessly fall back to pre-authored cancellation strategies and formal letter templates so all workflows remain functional.
