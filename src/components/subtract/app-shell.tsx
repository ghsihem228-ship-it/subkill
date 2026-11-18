"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Scissors } from "lucide-react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useSubtractStore, type TabId } from "@/lib/store"
import { AppHeader } from "./app-header"
import { ConnectDialog } from "./connect-dialog"
import { DashboardView } from "./dashboard-view"
import { SubscriptionsView } from "./subscriptions-view"
import { CancelLab } from "./cancel-lab"
import { LettersView } from "./letters-view"
import { ChatView } from "./chat-view"

const panelMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: "easeOut" as const },
}

export function AppShell() {
  const t = useTranslations("footer")
  const activeTab = useSubtractStore((s) => s.activeTab)
  const setActiveTab = useSubtractStore((s) => s.setActiveTab)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Thin scrollbar styling for scrollable panels lives in globals.css (.subtract-scroll) */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex min-h-screen flex-col gap-0"
      >
        <AppHeader />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <TabsContent value="dashboard" className="mt-0">
            <motion.div {...panelMotion}>
              <DashboardView />
            </motion.div>
          </TabsContent>
          <TabsContent value="subscriptions" className="mt-0">
            <motion.div {...panelMotion}>
              <SubscriptionsView />
            </motion.div>
          </TabsContent>
          <TabsContent value="cancel-lab" className="mt-0">
            <motion.div {...panelMotion}>
              <CancelLab />
            </motion.div>
          </TabsContent>
          <TabsContent value="letters" className="mt-0">
            <motion.div {...panelMotion}>
              <LettersView />
            </motion.div>
          </TabsContent>
          <TabsContent value="chat" className="mt-0">
            <motion.div {...panelMotion}>
              <ChatView />
            </motion.div>
          </TabsContent>
        </main>

        <footer className="mt-auto border-t border-zinc-200/80 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-600 sm:flex-row sm:px-6">
            <p className="flex items-center gap-2">
              <span
                className="flex size-4 items-center justify-center rounded-[4px] bg-red-600/90 text-white"
                aria-hidden="true"
              >
                <Scissors className="size-2.5" />
              </span>
              <span>{t("disclaimer")}</span>
            </p>
            <p className="flex items-center gap-3">
              <span>{t("simulated")}</span>
              <span aria-hidden="true" className="text-zinc-400">·</span>
              <span>{t("local")}</span>
            </p>
          </div>
        </footer>
      </Tabs>

      <ConnectDialog />
    </div>
  )
}
