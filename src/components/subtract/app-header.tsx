"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Check, Globe, Link2, RefreshCw, Scissors } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { runScan, formatMoney } from "@/lib/api"
import { APP_LOCALES, LOCALE_NATIVE_NAMES, LOCALE_SHORT_LABELS, type AppLocale } from "@/lib/i18n"
import { useLocaleStore, useSubtractStore, type TabId } from "@/lib/store"
import { cn } from "@/lib/utils"
import { NotificationsMenu } from "./notifications-menu"

const TABS: { id: TabId; key: "dashboard" | "subscriptions" | "cancelLab" | "letters" | "chat" }[] = [
  { id: "dashboard", key: "dashboard" },
  { id: "subscriptions", key: "subscriptions" },
  { id: "cancel-lab", key: "cancelLab" },
  { id: "letters", key: "letters" },
  { id: "chat", key: "chat" },
]

export function AppHeader() {
  const t = useTranslations("header")
  const tCommon = useTranslations("common")
  const setConnectOpen = useSubtractStore((s) => s.setConnectOpen)
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const queryClient = useQueryClient()

  const rescan = useMutation({
    mutationFn: runScan,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      if (result.detected.length > 0) {
        toast.success(
          t("scanFound", { count: result.detected.length, monthly: formatMoney(result.totalMonthly) })
        )
      } else {
        toast.info(t("scanNone"))
      }
    },
    onError: (err: Error) => toast.error(t("scanFailed", { error: err.message })),
  })

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-red-600 to-rose-500 text-white shadow-sm shadow-red-600/25 ring-1 ring-red-600/20"
              aria-hidden="true"
            >
              <Scissors className="size-[18px]" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight tracking-tight">
                Sub<span className="text-red-600">Kill</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">{t("tagline")}</p>
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 px-2.5 text-zinc-500 hover:text-zinc-900"
                  aria-label={t("changeLanguage")}
                >
                  <Globe className="size-4" />
                  <span className="text-xs font-semibold">{LOCALE_SHORT_LABELS[locale]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {APP_LOCALES.map((l: AppLocale) => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLocale(l)}
                    aria-current={locale === l ? "true" : undefined}
                    className="gap-2"
                  >
                    <Check className={cn("size-4", locale === l ? "opacity-100" : "opacity-0")} />
                    {LOCALE_NATIVE_NAMES[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationsMenu />
            <Button
              className="bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/25"
              onClick={() => setConnectOpen(true)}
            >
              <Link2 className="size-4" />
              <span className="hidden sm:inline">{tCommon("linkAccounts")}</span>
              <span className="sm:hidden">{tCommon("link")}</span>
            </Button>
            <Button
              variant="outline"
              className="shadow-xs transition-colors hover:border-zinc-400 hover:bg-zinc-50"
              onClick={() => rescan.mutate()}
              disabled={rescan.isPending}
            >
              <RefreshCw className={cn("size-4", rescan.isPending && "animate-spin")} />
              {tCommon("rescan")}
            </Button>
          </div>
        </div>
        <nav
          className="relative -mx-4 overflow-x-auto px-4 pb-3 subtract-scroll sm:mx-0 sm:px-0"
          aria-label={t("mainNav")}
        >
          <TabsList className="h-10 w-max min-w-full gap-0.5 rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-1 shadow-xs sm:min-w-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-8 rounded-lg px-3 text-sm text-zinc-500 transition-all duration-150 hover:text-zinc-800 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm sm:px-4"
              >
                {t(`tabs.${tab.key}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent sm:hidden rtl:bg-gradient-to-r"
          />
        </nav>
      </div>
    </header>
  )
}
