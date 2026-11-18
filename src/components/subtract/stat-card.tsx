// SubKill — compact stat card used on the dashboard.
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string
  sub?: string
  icon?: LucideIcon
  tone?: "default" | "red" | "emerald"
  className?: string
}

const TONES: Record<
  NonNullable<StatCardProps["tone"]>,
  { card: string; value: string; label: string; tile: string; wash: string }
> = {
  default: {
    card: "border-zinc-200/80 bg-card",
    value: "text-zinc-900",
    label: "text-zinc-500",
    tile: "bg-zinc-100 text-zinc-600",
    wash: "",
  },
  red: {
    card: "border-red-200/80",
    value: "text-red-700",
    label: "text-red-600/80",
    tile: "bg-red-50 text-red-600 ring-1 ring-red-100",
    wash: "bg-gradient-to-b from-red-50/80 via-red-50/30 to-transparent",
  },
  emerald: {
    card: "border-emerald-200/80",
    value: "text-emerald-700",
    label: "text-emerald-700/80",
    tile: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    wash: "bg-gradient-to-b from-emerald-50/80 via-emerald-50/30 to-transparent",
  },
}

export function StatCard({ label, value, sub, icon: Icon, tone = "default", className }: StatCardProps) {
  const t = TONES[tone]
  return (
    <Card
      className={cn(
        "card-hover relative gap-0 overflow-hidden rounded-xl p-5 shadow-xs sm:p-6",
        t.card,
        className
      )}
    >
      {t.wash ? <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", t.wash)} /> : null}
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "mt-1 text-[11px] font-semibold uppercase leading-none tracking-[0.08em]",
              t.label
            )}
          >
            {label}
          </p>
          {Icon ? (
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                t.tile
              )}
              aria-hidden="true"
            >
              <Icon className="size-4" strokeWidth={2} />
            </div>
          ) : null}
        </div>
        <div className="mt-auto">
          <p
            className={cn(
              "font-mono text-[28px] font-semibold leading-none tabular-nums tracking-tight",
              t.value
            )}
          >
            {value}
          </p>
          {sub ? <p className={cn("mt-2.5 text-xs leading-relaxed", t.label)}>{sub}</p> : null}
        </div>
      </div>
    </Card>
  )
}
