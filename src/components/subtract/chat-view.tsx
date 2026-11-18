"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import Markdown from "react-markdown"
import { format } from "date-fns"
import { Send, Skull, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { clearChat, getChat, sendChatMessage, type ChatMessageDTO } from "@/lib/api"
import { useLocaleStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const DEFAULT_INTRO =
  "I'm **Reaper**, your AI cancellation strategist. I know every subscription on your dashboard and exactly how merchants try to keep you paying. Ask me how to kill a charge, what your rights are, or for a script to read to a retention agent."

const SUGGESTION_KEYS = ["gym", "rights", "letter", "hardest"] as const

const MARKDOWN_COMPONENTS = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 last:mb-0" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-2 list-disc space-y-1 ps-4 last:mb-0" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-2 list-decimal space-y-1 ps-4 last:mb-0" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li {...props} />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-2 mb-1 font-semibold" {...props} />
  ),
}

function LoadingDots({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1 py-1" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-pulse rounded-full bg-zinc-400"
          style={{ animationDelay: `${i * 180}ms` }}
        />
      ))}
    </div>
  )
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red-600 to-rose-500 text-white shadow-sm shadow-red-600/20"
        aria-hidden="true"
      >
        <Skull className="size-4" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-ss-sm border border-zinc-200/80 bg-zinc-50/60 px-4 py-3 text-sm leading-relaxed shadow-xs">
        {children}
      </div>
    </div>
  )
}

function MessageTime({ iso, className }: { iso: string; className?: string }) {
  const time = (() => {
    try {
      return format(new Date(iso), "HH:mm")
    } catch {
      return ""
    }
  })()
  if (!time) return null
  return (
    <span className={cn("text-[10px] tabular-nums text-muted-foreground", className)}>{time}</span>
  )
}

export function ChatView() {
  const t = useTranslations("chat")
  const locale = useLocaleStore((s) => s.locale)
  const queryClient = useQueryClient()
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({ queryKey: ["chat"], queryFn: getChat })
  const messages: ChatMessageDTO[] = data?.messages ?? []

  const send = useMutation({
    mutationFn: (message: string) => sendChatMessage(message, locale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] })
    },
    onError: (err: Error) => {
      toast.error(t("toastReplyFailed", { error: err.message }))
      queryClient.invalidateQueries({ queryKey: ["chat"] })
    },
  })

  const clear = useMutation({
    mutationFn: clearChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] })
      toast.info(t("toastCleared"))
    },
    onError: (err: Error) => toast.error(t("toastClearFailed", { error: err.message })),
  })

  // Keep the conversation pinned to the bottom.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, send.isPending])

  function autoGrow() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function submit(text?: string) {
    const value = (text ?? input).trim()
    if (!value || send.isPending) return
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    // Optimistic user message
    queryClient.setQueryData<{ messages: ChatMessageDTO[]; intro?: string }>(["chat"], (old) => ({
      messages: [
        ...(old?.messages ?? []),
        {
          id: `optimistic-${Date.now()}`,
          role: "user" as const,
          content: value,
          createdAt: new Date().toISOString(),
        },
      ],
      intro: old?.intro,
    }))
    send.mutate(value)
  }

  const isEmpty = !isLoading && messages.length === 0

  return (
    <Card className="flex h-[calc(100vh-260px)] min-h-[480px] flex-col overflow-hidden rounded-xl border-zinc-200/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-rose-500 text-white shadow-sm shadow-red-600/20">
            <Skull className="size-4" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
              Reaper
              <span
                className="inline-block size-1.5 rounded-full bg-emerald-500"
                aria-label={t("online")}
                title={t("online")}
              />
            </p>
            <p className="text-xs text-muted-foreground">{t("strategist")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-500 hover:text-zinc-900"
          onClick={() => clear.mutate()}
          disabled={clear.isPending || messages.length === 0}
        >
          <Trash2 className="size-3.5" />
          {t("clear")}
        </Button>
      </div>

      {/* Messages */}
      <div className="subtract-scroll flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-3/4 rounded-2xl" />
            <Skeleton className="h-10 w-1/2 rounded-2xl" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col gap-4">
            <AssistantBubble>
              <Markdown components={MARKDOWN_COMPONENTS}>{data?.intro ?? DEFAULT_INTRO}</Markdown>
            </AssistantBubble>
            <div className="flex flex-wrap gap-2 ps-9">
              {SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => submit(t(`suggestions.${key}`))}
                  className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 shadow-xs transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"
                >
                  {t(`suggestions.${key}`)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex flex-col items-end gap-1">
                  <div className="max-w-[85%] rounded-2xl rounded-ee-sm bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-zinc-50 shadow-sm">
                    {m.content}
                  </div>
                  <MessageTime iso={m.createdAt} className="px-1" />
                </div>
              ) : (
                <div key={m.id} className="flex flex-col items-start gap-1">
                  <AssistantBubble>
                    <Markdown components={MARKDOWN_COMPONENTS}>{m.content}</Markdown>
                  </AssistantBubble>
                  <MessageTime iso={m.createdAt} className="ps-[38px]" />
                </div>
              )
            )}
            {send.isPending && (
              <AssistantBubble>
                <LoadingDots label={t("typing")} />
              </AssistantBubble>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-200/80 bg-zinc-50/40 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-200/80 bg-white p-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-red-600/10">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              autoGrow()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            placeholder={t("placeholder")}
            aria-label={t("messageAria")}
            className="max-h-40 min-h-9 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 focus-visible:border-0"
          />
          <Button
            size="icon"
            className={cn(
              "shrink-0 rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/20 transition-shadow hover:bg-red-700"
            )}
            onClick={() => submit()}
            disabled={!input.trim() || send.isPending}
            aria-label={t("sendAria")}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">{t("hint")}</p>
      </div>
    </Card>
  )
}
