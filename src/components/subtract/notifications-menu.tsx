"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format, formatDistanceToNow } from "date-fns"
import {
  Bell,
  CalendarClock,
  CheckCheck,
  FileText,
  Radar,
  Scissors,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead,
  type NotificationDTO,
  type NotificationType,
} from "@/lib/api"
import { dateFnsLocale } from "@/lib/i18n"
import { useLocaleStore, useSubtractStore, type TabId } from "@/lib/store"
import { cn } from "@/lib/utils"

const TYPE_META: Record<NotificationType, { icon: LucideIcon; tile: string; target: TabId }> = {
  detection: { icon: Radar, tile: "bg-zinc-100 text-zinc-600", target: "dashboard" },
  cancellation_started: { icon: Zap, tile: "bg-amber-50 text-amber-600 ring-1 ring-amber-100", target: "cancel-lab" },
  cancellation_completed: {
    icon: Scissors,
    tile: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    target: "cancel-lab",
  },
  letter_generated: { icon: FileText, tile: "bg-zinc-100 text-zinc-600", target: "letters" },
  upcoming_charge: { icon: CalendarClock, tile: "bg-red-50 text-red-600 ring-1 ring-red-100", target: "dashboard" },
}

export function NotificationsMenu() {
  const t = useTranslations("notifications")
  const locale = useLocaleStore((s) => s.locale)
  const setActiveTab = useSubtractStore((s) => s.setActiveTab)
  const openCancelLab = useSubtractStore((s) => s.openCancelLab)
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  const markRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const clearAll = useMutation({
    mutationFn: clearNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }

  function bodyText(n: NotificationDTO): string {
    const p = n.params ?? {}
    switch (n.type) {
      case "detection":
        return t("items.detection.body", { count: Number(p.count) || 0, monthly: p.monthly ?? "" })
      case "cancellation_started":
        return t("items.cancellation_started.body", { name: p.name ?? "" })
      case "cancellation_completed":
        return t("items.cancellation_completed.body", {
          name: p.name ?? "",
          monthly: p.monthly ?? "",
          annual: p.annual ?? "",
        })
      case "letter_generated":
        return t("items.letter_generated.body", { title: p.title ?? "" })
      case "upcoming_charge":
        return t("items.upcoming_charge.body", {
          name: p.name ?? "",
          amount: p.amount ?? "",
          date: p.date ? format(new Date(p.date), "MMM d", { locale: dateFnsLocale(locale) }) : "",
        })
    }
  }

  function handleItemClick(n: NotificationDTO) {
    const meta = TYPE_META[n.type]
    if ((n.type === "cancellation_started" || n.type === "cancellation_completed") && n.subscriptionId) {
      openCancelLab(n.subscriptionId)
    } else {
      setActiveTab(meta.target)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 text-zinc-500 hover:text-zinc-900"
          aria-label={t("buttonAria")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] max-w-[92vw] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {t("title")}
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">
                {unreadCount}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                onClick={() => markRead.mutate()}
                disabled={markRead.isPending}
              >
                <CheckCheck className="size-3.5" />
                {t("markAllRead")}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
              >
                <Trash2 className="size-3.5" />
                {t("clear")}
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="subtract-scroll max-h-96 divide-y divide-zinc-100 overflow-y-auto" role="list">
            {notifications.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.detection
              const Icon = meta.icon
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 p-3 text-start transition-colors hover:bg-zinc-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30",
                      !n.read && "bg-zinc-50"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", meta.tile)}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{t(`items.${n.type}.title`)}</span>
                        {!n.read && (
                          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-red-600" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {bodyText(n)}
                      </span>
                      <span className="mt-1 block text-[11px] text-zinc-400">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: dateFnsLocale(locale),
                        })}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
