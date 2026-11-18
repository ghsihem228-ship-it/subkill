"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import { ChevronRight, Link2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney, getSubscriptions, monthlyNormalized, type SubscriptionDTO } from "@/lib/api"
import { dateFnsLocale } from "@/lib/i18n"
import { useLocaleStore, useSubtractStore } from "@/lib/store"
import { DifficultyBadge, DifficultyMeter, SourceChip, StatusBadge, difficultyTierOf } from "./difficulty-meter"
import { SubscriptionIcon } from "./icons"
import { SubscriptionDetailSheet } from "./subscription-detail-sheet"
import { EmptyPanel } from "./empty-state"

type StatusFilter = "all" | "active" | "canceling" | "canceled"
type TierFilter = "all" | "easy" | "medium" | "hard" | "nightmare"
type SourceFilter = "all" | "bank" | "email" | "appstore"
type SortKey = "difficulty" | "amount" | "next-charge"

export function SubscriptionsView() {
  const t = useTranslations("subscriptions")
  const tCommon = useTranslations("common")
  const locale = useLocaleStore((s) => s.locale)
  const setConnectOpen = useSubtractStore((s) => s.setConnectOpen)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [tierFilter, setTierFilter] = useState<TierFilter>("all")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("difficulty")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: subscriptions, isLoading } = useQuery({ queryKey: ["subscriptions"], queryFn: getSubscriptions })

  const filtered = useMemo(() => {
    const list = subscriptions ?? []
    const q = search.trim().toLowerCase()
    return list
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false
        if (tierFilter !== "all" && difficultyTierOf(s.difficulty).tier !== tierFilter) return false
        if (sourceFilter !== "all" && s.detectedVia !== sourceFilter) return false
        if (q) {
          const haystack = `${s.name} ${s.merchant} ${s.category}`.toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortKey === "amount") {
          return monthlyNormalized(b.amount, b.cadence) - monthlyNormalized(a.amount, a.cadence)
        }
        if (sortKey === "next-charge") {
          const ta = a.nextCharge ? new Date(a.nextCharge).getTime() : Number.MAX_SAFE_INTEGER
          const tb = b.nextCharge ? new Date(b.nextCharge).getTime() : Number.MAX_SAFE_INTEGER
          return ta - tb
        }
        return b.difficulty - a.difficulty || b.amount - a.amount
      })
  }, [subscriptions, search, statusFilter, tierFilter, sourceFilter, sortKey])

  function openDetail(sub: SubscriptionDTO) {
    setSelectedId(sub.id)
    setSheetOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <EmptyPanel
        icon={Link2}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        action={
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => setConnectOpen(true)}>
            <Link2 className="size-4" />
            {tCommon("linkAccounts")}
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-0 flex-1 sm:min-w-56">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="rounded-lg border-zinc-200/80 bg-white ps-9 shadow-xs focus-visible:border-red-300"
            aria-label={t("searchAria")}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-36" aria-label={t("statusFilterAria")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("status.all")}</SelectItem>
            <SelectItem value="active">{t("status.active")}</SelectItem>
            <SelectItem value="canceling">{t("status.canceling")}</SelectItem>
            <SelectItem value="canceled">{t("status.canceled")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as TierFilter)}>
          <SelectTrigger className="w-full sm:w-36" aria-label={t("difficultyFilterAria")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("tier.all")}</SelectItem>
            <SelectItem value="easy">{t("tier.easy")}</SelectItem>
            <SelectItem value="medium">{t("tier.medium")}</SelectItem>
            <SelectItem value="hard">{t("tier.hard")}</SelectItem>
            <SelectItem value="nightmare">{t("tier.nightmare")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
          <SelectTrigger className="w-full sm:w-32" aria-label={t("sourceFilterAria")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("source.all")}</SelectItem>
            <SelectItem value="bank">{t("source.bank")}</SelectItem>
            <SelectItem value="email">{t("source.email")}</SelectItem>
            <SelectItem value="appstore">{t("source.appstore")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-44" aria-label={t("sortAria")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="difficulty">{t("sort.difficulty")}</SelectItem>
            <SelectItem value="amount">{t("sort.amount")}</SelectItem>
            <SelectItem value="next-charge">{t("sort.nextCharge")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t("listMeta", { shown: filtered.length, total: subscriptions.length })}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyPanel
          icon={Search}
          title={t("noMatchTitle")}
          description={t("noMatchDescription")}
        />
      ) : (
        <ul className="subtract-scroll flex max-h-[70vh] flex-col gap-2 overflow-y-auto pe-1" role="list">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => openDetail(s)}
                className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-card p-4 text-start shadow-xs transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50/70 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 sm:gap-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-600 transition-colors group-hover:border-zinc-200">
                  <SubscriptionIcon name={s.icon} className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 truncate text-xs">
                    <span className="font-mono text-zinc-400">{s.merchant}</span>
                    <span className="text-muted-foreground"> · {s.category}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <DifficultyMeter value={s.difficulty} />
                    <DifficultyBadge value={s.difficulty} />
                    <SourceChip source={s.detectedVia} />
                  </div>
                </div>
                <div className="hidden shrink-0 text-end sm:block">
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {formatMoney(monthlyNormalized(s.amount, s.cadence))}
                    {tCommon("perMonth")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.nextCharge
                      ? format(new Date(s.nextCharge), "MMM d", { locale: dateFnsLocale(locale) })
                      : "—"}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 rtl:rotate-180" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SubscriptionDetailSheet
        subscriptionId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
