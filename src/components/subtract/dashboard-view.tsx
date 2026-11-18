"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CalendarClock, Crosshair, Flame, PiggyBank, Receipt, Skull, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { formatMoney, getStats, getSubscriptions } from "@/lib/api"
import { dateFnsLocale } from "@/lib/i18n"
import { useLocaleStore, useSubtractStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { StatCard } from "./stat-card"
import { DifficultyBadge, DifficultyMeter, difficultyTierOf } from "./difficulty-meter"
import { SubscriptionIcon } from "./icons"
import { EmptyDashboardState } from "./empty-state"

function ChartTooltipContent({
  active,
  payload,
  label,
  perMonth,
}: {
  active?: boolean
  payload?: { value?: number }[]
  label?: string
  perMonth: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium">{label}</p>
      <p className="font-mono text-sm font-semibold tabular-nums">{formatMoney(value)}{perMonth}</p>
    </div>
  )
}

export function DashboardView() {
  const t = useTranslations("dashboard")
  const tCommon = useTranslations("common")
  const locale = useLocaleStore((s) => s.locale)
  const setConnectOpen = useSubtractStore((s) => s.setConnectOpen)
  const openCancelLab = useSubtractStore((s) => s.openCancelLab)

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["stats"], queryFn: getStats })
  const { data: subscriptions } = useQuery({ queryKey: ["subscriptions"], queryFn: getSubscriptions })

  function relativeChargeLabel(daysUntil: number): string {
    if (daysUntil <= 0) return t("today")
    if (daysUntil === 1) return t("tomorrow")
    return t("inDays", { count: daysUntil })
  }

  if (statsLoading || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-72 rounded-xl lg:col-span-3" />
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  const hasData = stats.activeCount > 0 || stats.canceledCount > 0

  if (!hasData) {
    return <EmptyDashboardState onConnect={() => setConnectOpen(true)} />
  }

  const worstOffenders = (subscriptions ?? [])
    .filter((s) => s.status === "active")
    .sort((a, b) => b.difficulty - a.difficulty || b.amount - a.amount)
    .slice(0, 3)

  const maxCategoryAmount = stats.byCategory.reduce((max, c) => Math.max(max, c.amount), 0)

  const chartCategories = (() => {
    const sorted = [...stats.byCategory].sort((a, b) => b.amount - a.amount)
    const top = sorted.slice(0, 6)
    const rest = sorted.slice(6)
    if (rest.length === 0) return top
    return [...top, { category: t("otherCategory"), amount: rest.reduce((sum, c) => sum + c.amount, 0) }]
  })()

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <section aria-label={t("spendingAria")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("monthlyBurn")}
          value={`${formatMoney(stats.monthlySpend)}${tCommon("perMonth")}`}
          sub={t("monthlyBurnSub")}
          icon={Flame}
        />
        <StatCard
          label={t("annualized")}
          value={formatMoney(stats.annualSpend)}
          sub={t("annualizedSub")}
          icon={CalendarClock}
        />
        <StatCard
          label={t("activeSubs")}
          value={String(stats.activeCount)}
          sub={t("activeSubsSub", { count: stats.hardCount })}
          icon={Receipt}
        />
        <StatCard
          label={t("hardToKill")}
          value={String(stats.hardCount)}
          sub={t("hardToKillSub")}
          icon={Skull}
          tone="red"
        />
      </section>

      {stats.canceledCount > 0 && (
        <section aria-label={t("savingsAria")} className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label={t("youKilled")}
            value={`${formatMoney(stats.savedMonthly)}${tCommon("perMonth")}`}
            sub={t("youKilledSub", {
              count: stats.canceledCount,
              annual: formatMoney(stats.savedAnnual),
            })}
            icon={PiggyBank}
            tone="emerald"
          />
          {stats.potentialMonthly > 0 && (
            <StatCard
              label={t("killPotential")}
              value={`${formatMoney(stats.potentialMonthly)}${tCommon("perMonth")}`}
              sub={t("killPotentialSub", { count: stats.hardCount })}
              icon={Crosshair}
            />
          )}
        </section>
      )}

      {/* Chart + upcoming charges */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-xl border-zinc-200/80 shadow-xs lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("chartTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byCategory.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t("chartEmpty")}</p>
            ) : (
              <div className="h-72 w-full pb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartCategories} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 10, fill: "#52525b" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={52}
                      tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#a1a1aa" }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip
                      cursor={{ fill: "#f4f4f5" }}
                      content={<ChartTooltipContent perMonth={tCommon("perMonth")} />}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                      {...({ minBarSize: 3 } as Record<string, number>)}
                    >
                      {chartCategories.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={entry.amount === maxCategoryAmount && maxCategoryAmount > 0 ? "#dc2626" : "#a1a1aa"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-zinc-200/80 shadow-xs lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("upcomingTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcoming.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t("upcomingEmpty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {stats.upcoming.slice(0, 5).map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-zinc-50/60">
                    <div className="ms-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                      <SubscriptionIcon name={u.icon} className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="mt-0.5 text-xs">
                        <span className="font-medium text-zinc-600">{relativeChargeLabel(u.daysUntil)}</span>
                        <span className="text-muted-foreground">
                          {" · "}
                          {format(new Date(u.date), "MMM d", { locale: dateFnsLocale(locale) })}
                        </span>
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{formatMoney(u.amount)}</p>
                  </li>
                ))}
                {stats.upcoming.length > 5 && (
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-1.5 pt-2.5 text-xs font-medium text-zinc-500 transition-colors hover:text-red-700"
                      onClick={() => useSubtractStore.getState().setActiveTab("subscriptions")}
                    >
                      {t("moreScheduled", { count: stats.upcoming.length - 5 })}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Worst offenders */}
      <section aria-label={t("worstAria")} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
          <h2 className="text-base font-semibold">{t("worstTitle")}</h2>
          <span className="text-xs text-muted-foreground">{t("worstSub")}</span>
        </div>
        {worstOffenders.length === 0 ? (
          <Card className="rounded-xl border-zinc-200/80 p-6 text-center text-sm text-muted-foreground shadow-xs">
            {t("worstEmpty")}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {worstOffenders.map((s) => {
              const tier = difficultyTierOf(s.difficulty)
              return (
                <Card
                  key={s.id}
                  className="card-hover relative gap-0 overflow-hidden rounded-xl border-zinc-200/80 p-4 shadow-xs sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-x-0 top-0 h-[3px] opacity-80", tier.accent)}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg",
                          tier.tile
                        )}
                      >
                        <SubscriptionIcon name={s.icon} className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{s.name}</p>
                        <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatMoney(s.amount)}
                          {s.cadence === "yearly" ? tCommon("perYear") : tCommon("perMonth")}
                        </p>
                      </div>
                    </div>
                    <DifficultyBadge value={s.difficulty} />
                  </div>
                  <div className="mt-3">
                    <DifficultyMeter value={s.difficulty} />
                  </div>
                  <Button
                    size="sm"
                    className="mt-4 w-full bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
                    onClick={() => openCancelLab(s.id)}
                  >
                    <Zap className="size-3.5" />
                    {t("killIt")}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
