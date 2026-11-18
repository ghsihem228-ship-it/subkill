"use client"

// SubKill — reusable empty state panel and the dashboard onboarding empty state.
import { useTranslations } from "next-intl"
import { Link2, Scissors, type LucideIcon } from "lucide-react"
import { Landmark, Mail, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/40 p-10 text-center",
        className
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-400 shadow-xs">
        <Icon className="size-5" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="font-medium text-zinc-900">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

const PROVIDER_CARDS: { key: "chase" | "gmail" | "appstore"; icon: LucideIcon }[] = [
  { key: "chase", icon: Landmark },
  { key: "gmail", icon: Mail },
  { key: "appstore", icon: Smartphone },
]

export function EmptyDashboardState({ onConnect }: { onConnect: () => void }) {
  const t = useTranslations("welcome")
  const tConnect = useTranslations("connect")
  const tCommon = useTranslations("common")

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-card px-4 py-12 text-center shadow-xs sm:px-10 sm:py-16">
      {/* Subtle radial dot pattern, faded at the edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(228_228_231)_1px,transparent_1px)] [background-size:22px_22px] opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_35%,black,transparent)]"
      />
      {/* Faint red radial wash from the top */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgb(220_38_38_0.05),transparent)]"
      />

      <div className="relative flex flex-col items-center gap-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/20 ring-1 ring-red-600/20">
          <Scissors className="size-7" />
        </div>
        <div className="max-w-2xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600">{t("kicker")}</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-[40px] sm:leading-[1.15]">
            {t("headline")}
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("description")}
          </p>
        </div>
        <Button
          size="lg"
          className="bg-red-600 text-white shadow-md shadow-red-600/25 hover:bg-red-700"
          onClick={onConnect}
        >
          <Link2 className="size-4" />
          {tCommon("linkAccounts")}
        </Button>
        <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          {PROVIDER_CARDS.map((p) => (
            <Card
              key={p.key}
              className="card-hover gap-0 rounded-xl border-zinc-200/80 bg-white/80 p-4 text-start shadow-xs backdrop-blur-[2px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-600">
                  <p.icon className="size-4" />
                </div>
                <p className="text-sm font-medium">{tConnect(`providers.${p.key}.name`)}</p>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                {tConnect(`providers.${p.key}.blurb`)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
