"use client"

// SubKill — difficulty meter, tier badge, status badge, source chip.
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { SourceType, SubscriptionStatus } from "@/lib/api"
import { SOURCE_META } from "./icons"

export type DifficultyTier = "easy" | "medium" | "hard" | "nightmare"

export function difficultyTierOf(value: number): {
  tier: DifficultyTier
  text: string
  badge: string
  accent: string
  tile: string
} {
  if (value <= 3) {
    return {
      tier: "easy",
      text: "text-emerald-600",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accent: "bg-emerald-500",
      tile: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    }
  }
  if (value <= 5) {
    return {
      tier: "medium",
      text: "text-amber-600",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      accent: "bg-amber-500",
      tile: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
    }
  }
  if (value <= 8) {
    return {
      tier: "hard",
      text: "text-orange-600",
      badge: "bg-orange-50 text-orange-700 border-orange-200",
      accent: "bg-orange-500",
      tile: "bg-orange-50 text-orange-600 ring-1 ring-orange-100",
    }
  }
  return {
    tier: "nightmare",
    text: "text-red-600",
    badge: "bg-red-50 text-red-700 border-red-200",
    accent: "bg-red-600",
    tile: "bg-red-50 text-red-600 ring-1 ring-red-100",
  }
}

function segmentColor(position: number): string {
  if (position <= 3) return "bg-emerald-500"
  if (position <= 5) return "bg-amber-500"
  if (position <= 8) return "bg-orange-500"
  return "bg-red-600"
}

export function DifficultyMeter({ value, className }: { value: number; className?: string }) {
  const t = useTranslations("difficulty")
  return (
    <div
      className={cn("flex items-center gap-[2.5px]", className)}
      role="img"
      aria-label={t("aria", { value })}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1 rounded-full transition-colors duration-150",
            i < value ? segmentColor(i + 1) : "bg-zinc-200/80"
          )}
        />
      ))}
    </div>
  )
}

export function DifficultyBadge({ value, className }: { value: number; className?: string }) {
  const t = useTranslations("difficulty")
  const tier = difficultyTierOf(value)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tier.badge,
        className
      )}
    >
      {t(`tiers.${tier.tier}`)}
    </span>
  )
}

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-zinc-100 text-zinc-700 border-zinc-200",
  canceling: "bg-amber-50 text-amber-700 border-amber-200",
  canceled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  undetected: "bg-zinc-100 text-zinc-500 border-zinc-200",
}

export function StatusBadge({ status, className }: { status: SubscriptionStatus; className?: string }) {
  const t = useTranslations("difficulty")
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? STATUS_STYLES.active,
        className
      )}
    >
      {status === "canceling" ? (
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-amber-500" />
      ) : null}
      {t(`status.${status}`)}
    </span>
  )
}

export function SourceChip({ source, className }: { source: SourceType; className?: string }) {
  const t = useTranslations("difficulty")
  const meta = SOURCE_META[source]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500",
        className
      )}
    >
      <Icon className="size-3" />
      {t(`sources.${source}`)}
    </span>
  )
}
