"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { CheckCircle2, Landmark, Loader2, Mail, Radar, Smartphone, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { connectAccount, formatMoney, getAccounts, runScan, type ScanResult } from "@/lib/api"
import { useSubtractStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { SOURCE_META } from "./icons"
import { SourceChip } from "./difficulty-meter"

type ProviderKey = "chase" | "gmail" | "appstore"
type Phase = "connect" | "scanning" | "results"

type ProviderDef = { key: ProviderKey; icon: LucideIcon }

const PROVIDERS: ProviderDef[] = [
  { key: "chase", icon: Landmark },
  { key: "gmail", icon: Mail },
  { key: "appstore", icon: Smartphone },
]

type ConnState = { status: "idle" | "connecting" | "connected"; transactionCount: number }

const INITIAL_CONNECTIONS: Record<ProviderKey, ConnState> = {
  chase: { status: "idle", transactionCount: 0 },
  gmail: { status: "idle", transactionCount: 0 },
  appstore: { status: "idle", transactionCount: 0 },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ConnectDialog() {
  const t = useTranslations("connect")
  const tCommon = useTranslations("common")
  const open = useSubtractStore((s) => s.connectOpen)
  const setConnectOpen = useSubtractStore((s) => s.setConnectOpen)
  const queryClient = useQueryClient()

  const [phase, setPhase] = useState<Phase>("connect")
  const [connections, setConnections] = useState<Record<ProviderKey, ConnState>>(INITIAL_CONNECTIONS)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [progress, setProgress] = useState(0)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
    enabled: open,
  })

  // Providers already connected on the server (derived, not synced into state).
  const serverProviders = useMemo(() => new Set((accounts ?? []).map((a) => a.provider)), [accounts])

  // Clean up the progress timer on unmount.
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current)
    }
  }, [])

  function resetFlow() {
    setPhase("connect")
    setScanResult(null)
    setProgress(0)
  }

  function handleOpenChange(next: boolean) {
    setConnectOpen(next)
    if (!next) resetFlow()
  }

  const isConnected = (key: ProviderKey) => connections[key].status === "connected" || serverProviders.has(key)
  const connectedCount = PROVIDERS.filter((p) => isConnected(p.key)).length

  const connect = useMutation({
    mutationFn: async (provider: ProviderKey) => {
      setConnections((prev) => ({ ...prev, [provider]: { status: "connecting", transactionCount: 0 } }))
      const [result] = await Promise.all([connectAccount(provider), delay(1200)])
      return result
    },
    onSuccess: (result, provider) => {
      setConnections((prev) => ({
        ...prev,
        [provider]: { status: "connected", transactionCount: result.transactionCount },
      }))
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success(
        t("toastConnected", { name: result.account.name, count: result.transactionCount })
      )
    },
    onError: (err: Error, provider) => {
      setConnections((prev) => ({ ...prev, [provider]: { status: "idle", transactionCount: 0 } }))
      toast.error(t("toastConnectFailed", { error: err.message }))
    },
  })

  const scan = useMutation({
    mutationFn: async () => {
      setPhase("scanning")
      setProgress(0)
      if (progressTimer.current) clearInterval(progressTimer.current)
      progressTimer.current = setInterval(() => {
        setProgress((p) => Math.min(97, p + 100 / 60))
      }, 30)
      const [result] = await Promise.all([runScan(), delay(1800)])
      return result
    },
    onSuccess: (result) => {
      if (progressTimer.current) clearInterval(progressTimer.current)
      setProgress(100)
      setScanResult(result)
      setPhase("results")
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err: Error) => {
      if (progressTimer.current) clearInterval(progressTimer.current)
      setPhase("connect")
      toast.error(t("toastScanFailed", { error: err.message }))
    },
  })

  function finish() {
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    queryClient.invalidateQueries({ queryKey: ["stats"] })
    queryClient.invalidateQueries({ queryKey: ["accounts"] })
    setConnectOpen(false)
    resetFlow()
    if (scanResult && scanResult.detected.length > 0) {
      toast.success(
        t("toastAdded", {
          count: scanResult.detected.length,
          monthly: formatMoney(scanResult.totalMonthly),
        })
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto subtract-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {phase === "results" ? t("resultsDescription") : t("description")}
          </DialogDescription>
        </DialogHeader>

        {phase === "connect" && (
          <div className="flex flex-col gap-3">
            {PROVIDERS.map((p) => {
              const state = connections[p.key]
              const connected = isConnected(p.key)
              const Icon = p.icon
              return (
                <div key={p.key} className="flex items-center gap-3 rounded-xl border border-zinc-200/80 p-4 shadow-xs transition-colors">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-600">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t(`providers.${p.key}.name`)}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {t(`providers.${p.key}.blurb`)}
                    </p>
                    {state.status === "connected" && state.transactionCount > 0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        {t("pulled", { count: state.transactionCount })}
                      </p>
                    )}
                  </div>
                  {connected ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="size-3.5" />
                      {t("connected")}
                    </span>
                  ) : state.status === "connecting" ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("connecting")}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 shadow-xs transition-colors hover:border-zinc-400 hover:bg-zinc-50"
                      onClick={() => connect.mutate(p.key)}
                      disabled={connect.isPending}
                    >
                      {t("connect")}
                    </Button>
                  )}
                </div>
              )
            })}

            <Button
              className="mt-1 w-full bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
              size="lg"
              disabled={connectedCount === 0 || scan.isPending}
              onClick={() => scan.mutate()}
            >
              <Radar className="size-4" />
              {t("runScan")}
              {connectedCount === 0 ? null : (
                <span className="text-xs opacity-80">{t("sourcesCount", { count: connectedCount })}</span>
              )}
            </Button>
            {connectedCount === 0 && (
              <p className="text-center text-xs text-muted-foreground">{t("connectHint")}</p>
            )}
          </div>
        )}

        {phase === "scanning" && (
          <div className="flex flex-col gap-4 py-8">
            <div className="flex items-center justify-center gap-3">
              <Radar className="size-6 animate-pulse text-red-600" />
              <p className="text-sm font-medium">{t("scanning")}</p>
            </div>
            <Progress value={progress} className="h-2 w-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("scanningSub")}</span>
              <span className="font-mono tabular-nums">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {phase === "results" && scanResult && (
          <div className="flex flex-col gap-4">
            {scanResult.detected.length > 0 ? (
              <>
                <div className="rounded-xl border border-red-200/80 bg-red-50/70 p-4 text-center">
                  <p className="text-sm font-medium text-red-700">
                    {t("found", { count: scanResult.detected.length })}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-red-700">
                    {formatMoney(scanResult.totalMonthly)}
                    {tCommon("perMonth")}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {scanResult.detected.map((d) => {
                    const Icon = SOURCE_META[d.source].icon
                    return (
                      <div
                        key={d.slug}
                        className={cn("flex items-center gap-3 rounded-xl border border-zinc-200/80 p-3 shadow-xs")}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-600">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <SourceChip source={d.source} />
                            <span className="text-xs text-muted-foreground">
                              {t("seenCount", { count: d.occurrences })}
                            </span>
                          </div>
                        </div>
                        <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                          {formatMoney(d.amount)}
                          <span className="text-xs font-normal text-muted-foreground">
                            {d.cadence === "yearly" ? tCommon("perYear") : tCommon("perMonth")}
                          </span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-xl border p-6 text-center">
                <p className="text-sm font-medium">{t("noneFound")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("noneFoundSub")}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700" onClick={finish}>
                {t("addAll")}
              </Button>
              <Button variant="ghost" onClick={() => setPhase("connect")}>
                {t("backToSources")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
