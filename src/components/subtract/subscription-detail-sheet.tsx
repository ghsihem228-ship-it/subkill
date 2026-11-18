"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import { CheckCircle2, Clock, FileText, Landmark, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney, getSubscriptionDetail, monthlyNormalized } from "@/lib/api"
import { dateFnsLocale } from "@/lib/i18n"
import { useLocaleStore, useSubtractStore } from "@/lib/store"
import { DifficultyBadge, DifficultyMeter, SourceChip, StatusBadge } from "./difficulty-meter"
import { SubscriptionIcon } from "./icons"

export function SubscriptionDetailSheet({
  subscriptionId,
  open,
  onOpenChange,
}: {
  subscriptionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("detail")
  const tCommon = useTranslations("common")
  const locale = useLocaleStore((s) => s.locale)
  const openCancelLab = useSubtractStore((s) => s.openCancelLab)

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: () => getSubscriptionDetail(subscriptionId as string),
    enabled: open && !!subscriptionId,
  })

  const sub = data?.subscription
  const dfLocale = dateFnsLocale(locale)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="subtract-scroll w-full overflow-y-auto sm:max-w-xl lg:max-w-2xl">
        {isLoading || !sub ? (
          <div className="mt-6 flex flex-col gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <SheetHeader className="text-start">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-600">
                  <SubscriptionIcon name={sub.icon} className="size-5" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-lg leading-tight">{sub.name}</SheetTitle>
                  <SheetDescription className="mt-0.5">{sub.merchant}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Top facts */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={sub.status} />
              <SourceChip source={sub.detectedVia} />
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatMoney(monthlyNormalized(sub.amount, sub.cadence))}
                {tCommon("perMonth")}
              </span>
              {sub.nextCharge && (
                <span className="text-xs text-muted-foreground">
                  {t("nextCharge", {
                    date: format(new Date(sub.nextCharge), "MMM d, yyyy", { locale: dfLocale }),
                  })}
                </span>
              )}
            </div>

            {/* Canceled savings banner */}
            {sub.status === "canceled" && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 border-s-[3px] border-s-emerald-500 bg-emerald-50/70 p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">{t("killed")}</p>
                  <p className="font-mono text-sm tabular-nums text-emerald-700">
                    {t("savings", {
                      monthly: formatMoney(monthlyNormalized(sub.amount, sub.cadence)),
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Difficulty breakdown */}
            <section aria-label={t("difficulty")} className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{t("difficulty")}</p>
                <div className="flex items-center gap-2">
                  <DifficultyMeter value={sub.difficulty} />
                  <DifficultyBadge value={sub.difficulty} />
                </div>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{sub.difficultyReason}</p>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-zinc-50 p-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                <p className="text-xs leading-relaxed text-zinc-600">
                  <span className="font-medium">{t("cancellationMethod")}</span> {sub.cancellationMethod}
                </p>
              </div>
              {sub.notes && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-zinc-50 p-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-zinc-500" />
                  <p className="text-xs leading-relaxed text-zinc-600">{sub.notes}</p>
                </div>
              )}
            </section>

            {/* CTA */}
            {sub.status === "active" && (
              <Button
                className="bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
                size="lg"
                onClick={() => openCancelLab(sub.id)}
              >
                <Zap className="size-4" />
                {t("startCancellation")}
              </Button>
            )}
            {sub.status === "canceling" && (
              <Button
                className="bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
                size="lg"
                onClick={() => openCancelLab(sub.id)}
              >
                {t("continueLab")}
              </Button>
            )}

            <Separator />

            {/* Transaction history */}
            <section aria-label={t("transactionHistory")} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("transactionHistory")}</h3>
                <span className="text-xs text-muted-foreground">
                  {t("charges", { count: data.transactions.length })}
                </span>
              </div>
              {data.transactions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300/80 p-6 text-center text-sm text-muted-foreground">
                  {t("noTransactions")}
                </p>
              ) : (
                <ul className="subtract-scroll flex max-h-72 flex-col divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200/80">
                  {data.transactions.map((txn) => (
                    <li key={txn.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-zinc-50/70">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200/60 bg-zinc-50 text-zinc-500">
                        <Landmark className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{txn.merchant}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {format(new Date(txn.date), "MMM d, yyyy", { locale: dfLocale })} · {txn.accountName}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{formatMoney(txn.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {sub.cancellation && !sub.cancellation.completedAt && (
              <p className="flex items-center gap-2 text-xs text-amber-700">
                <Loader2 className="size-3.5 animate-spin" />
                {t("inProgress", { current: sub.cancellation.currentStep, total: sub.steps.length })}
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
