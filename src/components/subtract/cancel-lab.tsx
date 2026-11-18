"use client"

import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { format } from "date-fns"
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Clock,
  FileText,
  Link2,
  Skull,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cancellationAction, formatMoney, getSubscriptions, monthlyNormalized, type SubscriptionDTO } from "@/lib/api"
import { dateFnsLocale } from "@/lib/i18n"
import { useLocaleStore, useSubtractStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { DifficultyBadge, DifficultyMeter, StatusBadge } from "./difficulty-meter"
import { STEP_TYPE_META, SubscriptionIcon } from "./icons"
import { EmptyPanel } from "./empty-state"

const STATUS_ORDER: Record<string, number> = { active: 0, canceling: 1, canceled: 2 }

function progressPercent(sub: SubscriptionDTO): number {
  if (sub.steps.length === 0) return 0
  const done = sub.steps.filter((s) => s.done).length
  return Math.round((done / sub.steps.length) * 100)
}

export function CancelLab() {
  const t = useTranslations("cancelLab")
  const tCommon = useTranslations("common")
  const locale = useLocaleStore((s) => s.locale)
  const cancelLabSubId = useSubtractStore((s) => s.cancelLabSubId)
  const setCancelLabSub = useSubtractStore((s) => s.setCancelLabSub)
  const setActiveTab = useSubtractStore((s) => s.setActiveTab)
  const openLetters = useSubtractStore((s) => s.openLetters)
  const setConnectOpen = useSubtractStore((s) => s.setConnectOpen)
  const queryClient = useQueryClient()

  const { data: subscriptions, isLoading } = useQuery({ queryKey: ["subscriptions"], queryFn: getSubscriptions })

  const sorted = useMemo(() => {
    return (subscriptions ?? [])
      .slice()
      .sort(
        (a, b) =>
          (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
          b.difficulty - a.difficulty ||
          b.amount - a.amount
      )
  }, [subscriptions])

  const selected = sorted.find((s) => s.id === cancelLabSubId) ?? sorted[0] ?? null

  const action = useMutation({
    mutationFn: ({ id, act }: { id: string; act: "start" | "advance" | "reset" }) => cancellationAction(id, act),
    onSuccess: (sub, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["subscription", sub.id] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      if (sub.status === "canceled") {
        toast.success(
          t("toastKilled", {
            name: sub.name,
            monthly: formatMoney(monthlyNormalized(sub.amount, sub.cadence)),
          })
        )
      } else if (variables.act === "start") {
        toast.info(t("toastStarted", { name: sub.name }))
      } else if (variables.act === "reset") {
        toast.info(t("toastReset", { name: sub.name }))
      }
    },
    onError: (err: Error) => toast.error(t("toastFailed", { error: err.message })),
  })

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!selected) {
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
    <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
      {/* Selection list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">{t("targets")}</h2>
          <span className="text-xs text-muted-foreground">{t("total", { count: sorted.length })}</span>
        </div>
        <ul className="subtract-scroll flex max-h-64 flex-col gap-2 overflow-y-auto pe-1 lg:max-h-[70vh]" role="list">
          {sorted.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setCancelLabSub(s.id)}
                aria-current={selected.id === s.id ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-start shadow-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30",
                  selected.id === s.id
                    ? "border-red-600/70 bg-red-50/50 ring-1 ring-red-600/10"
                    : "border-zinc-200/80 bg-card hover:border-zinc-300 hover:bg-zinc-50/70"
                )}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                  <SubscriptionIcon name={s.icon} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatMoney(monthlyNormalized(s.amount, s.cadence))}
                    {tCommon("perMonth")}
                  </p>
                  <div className="mt-1.5">
                    <DifficultyBadge value={s.difficulty} />
                  </div>
                </div>
                <div className="w-14 shrink-0 text-end">
                  <p className="font-mono text-xs font-medium tabular-nums">{progressPercent(s)}%</p>
                  <Progress value={progressPercent(s)} className="mt-1.5 h-1" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Wizard panel */}
      {selected.status === "active" && (
        <StartPanel sub={selected} onStart={() => action.mutate({ id: selected.id, act: "start" })} pending={action.isPending} />
      )}
      {selected.status === "canceling" && selected.cancellation && (
        <WizardPanel
          sub={selected}
          onAdvance={() => action.mutate({ id: selected.id, act: "advance" })}
          onGenerateLetter={() =>
            openLetters({ subscriptionId: selected.id, templateType: "certified_mail" })
          }
          pending={action.isPending}
        />
      )}
      {selected.status === "canceled" && (
        <CompletedPanel
          sub={selected}
          onBack={() => setActiveTab("subscriptions")}
          onReset={() => action.mutate({ id: selected.id, act: "reset" })}
          pending={action.isPending}
        />
      )}
      {selected.status === "canceling" && !selected.cancellation && (
        <StartPanel sub={selected} onStart={() => action.mutate({ id: selected.id, act: "start" })} pending={action.isPending} />
      )}
    </div>
  )
}

function WizardHeader({ sub, minLeft }: { sub: SubscriptionDTO; minLeft: string }) {
  return (
    <CardHeader className="gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-600">
            <SubscriptionIcon name={sub.icon} className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-base leading-tight">{sub.name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{sub.cancellationMethod}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <DifficultyBadge value={sub.difficulty} />
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{minLeft}</span>
        </div>
      </div>
      <DifficultyMeter value={sub.difficulty} />
    </CardHeader>
  )
}

function StepChecklist({
  sub,
  currentOrder,
  currentLabel,
}: {
  sub: SubscriptionDTO
  currentOrder: number | null
  currentLabel: string
}) {
  const t = useTranslations("cancelLab")
  const steps = [...sub.steps].sort((a, b) => a.order - b.order)
  return (
    <section aria-label={t("allSteps")} className="flex flex-col gap-1.5">
      <h3 className="px-1 text-sm font-semibold">{t("allSteps")}</h3>
      <ol className="flex flex-col gap-1.5">
        {steps.map((step) => {
          const isDone = step.done
          const isCurrent = !isDone && currentOrder !== null && step.order === currentOrder
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2",
                isDone && "text-muted-foreground",
                isCurrent && "border-red-200 bg-red-50/60",
                !isDone && !isCurrent && "text-muted-foreground/70"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : isCurrent ? (
                <CircleDot className="size-4 shrink-0 text-red-600" />
              ) : (
                <Circle className="size-4 shrink-0 text-zinc-300" />
              )}
              <span className={cn("min-w-0 flex-1 truncate text-sm", isDone && "line-through")}>{step.title}</span>
              {isCurrent && (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                  {currentLabel}
                </span>
              )}
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {t("minShort", { count: step.estimatedMinutes })}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StartPanel({ sub, onStart, pending }: { sub: SubscriptionDTO; onStart: () => void; pending: boolean }) {
  const t = useTranslations("cancelLab")
  const steps = [...sub.steps].sort((a, b) => a.order - b.order)
  const hoops = sub.steps.filter((s) => s.hoop).length
  const totalMinutes = sub.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0)
  return (
    <Card className="rounded-xl border-zinc-200/80 shadow-xs">
      <WizardHeader
        sub={sub}
        minLeft={t("minLeft", { count: totalMinutes })}
      />
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("metricDifficulty")}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
              {t("difficultyOfTen", { value: sub.difficulty })}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("metricSteps")}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{sub.steps.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("metricHoops")}
            </p>
            <p className={cn("mt-1 font-mono text-sm font-semibold tabular-nums", hoops > 0 && "text-amber-600")}>
              {hoops}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("metricTime")}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
              {t("estMinutes", { count: totalMinutes })}
            </p>
          </div>
        </div>
        {hoops > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg border border-s-[3px] border-s-amber-400 border-amber-200/80 bg-amber-50/70 p-3.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <TriangleAlert className="size-3.5" />
            </div>
            <p className="text-xs leading-relaxed text-amber-900">{t("hoopWarning")}</p>
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{sub.difficultyReason}</p>
        <StepChecklist sub={sub} currentOrder={null} currentLabel={t("current")} />
        <Button
          size="lg"
          className="bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
          onClick={onStart}
          disabled={pending}
        >
          <Zap className="size-4" />
          {t("startCancellation")}
        </Button>
      </CardContent>
    </Card>
  )
}

function WizardPanel({
  sub,
  onAdvance,
  onGenerateLetter,
  pending,
}: {
  sub: SubscriptionDTO
  onAdvance: () => void
  onGenerateLetter: () => void
  pending: boolean
}) {
  const t = useTranslations("cancelLab")
  const steps = [...sub.steps].sort((a, b) => a.order - b.order)
  const currentStepNumber = sub.cancellation?.currentStep ?? 1
  const currentStep = steps.find((s) => s.order === currentStepNumber) ?? steps[steps.length - 1]
  const doneCount = steps.filter((s) => s.done).length
  const pct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0
  const remainingMinutes = sub.steps.filter((s) => !s.done).reduce((sum, s) => sum + s.estimatedMinutes, 0)
  const stepMeta = STEP_TYPE_META[currentStep.type]
  const StepIcon: LucideIcon = stepMeta.icon

  return (
    <Card className="rounded-xl border-zinc-200/80 shadow-xs">
      <WizardHeader
        sub={sub}
        minLeft={t("minLeft", { count: remainingMinutes })}
      />
      <CardContent className="flex flex-col gap-5">
        {/* Progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-mono text-muted-foreground tabular-nums">
              {t("progressSteps", { current: Math.min(doneCount + 1, steps.length), total: steps.length })}
              <span className="not-italic"> · {t("completeCount", { count: doneCount })}</span>
            </span>
            <span className="font-mono font-semibold tabular-nums">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5 bg-zinc-200/70 [&>div]:rounded-full [&>div]:bg-red-600" />
        </div>

        {/* Current step — visual anchor */}
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-md shadow-zinc-900/5 ring-1 ring-zinc-900/5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100"
                aria-hidden="true"
              >
                <StepIcon className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-medium text-zinc-500">{t(`stepTypes.${currentStep.type}`)}</p>
                <p className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
                  {t("stepOf", { current: currentStep.order, total: steps.length })}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="font-mono tabular-nums">{t("minEstimate", { count: currentStep.estimatedMinutes })}</span>
            </span>
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight">{currentStep.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{currentStep.description}</p>
          {currentStep.hoop && currentStep.hoopScript && (
            <div className="mt-4 rounded-lg border border-s-[3px] border-s-amber-400 border-amber-200/80 bg-amber-50/70 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                <TriangleAlert className="size-3.5" />
                {t("retentionHoop")}
              </p>
              <blockquote className="mt-2.5 rounded-md border border-amber-200 bg-white/80 px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-amber-950">
                {`"${currentStep.hoopScript}"`}
              </blockquote>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              className="bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
              onClick={onAdvance}
              disabled={pending}
            >
              <CheckCircle2 className="size-4" />
              {t("markComplete")}
            </Button>
            {currentStep.type === "mail" && (
              <Button variant="outline" onClick={onGenerateLetter}>
                <FileText className="size-4" />
                {t("generateLetter")}
              </Button>
            )}
          </div>
        </motion.div>

        <StepChecklist sub={sub} currentOrder={currentStep.order} currentLabel={t("current")} />
      </CardContent>
    </Card>
  )
}

function CompletedPanel({
  sub,
  onBack,
  onReset,
  pending,
}: {
  sub: SubscriptionDTO
  onBack: () => void
  onReset: () => void
  pending: boolean
}) {
  const t = useTranslations("cancelLab")
  const locale = useLocaleStore((s) => s.locale)
  const savedMonthly = monthlyNormalized(sub.amount, sub.cadence)
  const totalMinutes = sub.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0)
  const completedAt = sub.cancellation?.completedAt

  return (
    <div className="flex flex-col gap-5">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Card className="rounded-xl border-emerald-200/80 bg-emerald-50/40 p-6 text-center shadow-xs sm:p-10">
          <div className="mx-auto w-fit -rotate-6">
            <div className="rounded-md border-[3px] border-red-600/90 p-[3px]">
              <div className="rounded-[4px] border-2 border-red-600/60 px-7 py-2">
                <p className="text-2xl font-black uppercase tracking-[0.3em] text-red-600 drop-shadow-sm sm:text-3xl">
                  {t("killedStamp")}
                </p>
              </div>
            </div>
          </div>
          <h3 className="mt-6 text-lg font-semibold tracking-tight">{t("isDead", { name: sub.name })}</h3>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-emerald-700">
            {t("monthlySavings", { monthly: formatMoney(savedMonthly) })}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("annualBack", { annual: formatMoney(savedMonthly * 12) })}
            {completedAt
              ? ` · ${t("completedOn", {
                  date: format(new Date(completedAt), "MMM d, yyyy", { locale: dateFnsLocale(locale) }),
                })}`
              : ""}
            {` · ${t("workSummary", { count: sub.steps.length, minutes: totalMinutes })}`}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" onClick={onBack}>
              {t("backToSubscriptions")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" disabled={pending}>
                  {t("moreActions")}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={onReset}>{t("startOver")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </motion.div>

      <Card className="rounded-xl border-zinc-200/80 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Skull className="size-4 text-red-600" />
            {t("killRecord")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StepChecklist sub={sub} currentOrder={null} currentLabel={t("current")} />
        </CardContent>
      </Card>
    </div>
  )
}
