"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
import { Copy, Download, FileText, Loader2, Trash2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { createLetter, deleteLetter, getLetters, getSubscriptions, type LetterDTO, type TemplateType } from "@/lib/api"
import { dateFnsLocale } from "@/lib/i18n"
import { useLocaleStore, useSubtractStore } from "@/lib/store"
import { EmptyPanel } from "./empty-state"

const TEMPLATE_VALUES: TemplateType[] = ["cancellation_demand", "certified_mail", "chargeback", "ag_complaint"]

export function LettersView() {
  const t = useTranslations("letters")
  const locale = useLocaleStore((s) => s.locale)
  const queryClient = useQueryClient()
  const lettersPrefill = useSubtractStore((s) => s.lettersPrefill)
  const setLettersPrefill = useSubtractStore((s) => s.setLettersPrefill)

  const [subscriptionId, setSubscriptionId] = useState(() => lettersPrefill?.subscriptionId ?? "")
  const [templateType, setTemplateType] = useState<TemplateType | "">(lettersPrefill?.templateType ?? "")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const { data: subscriptions } = useQuery({ queryKey: ["subscriptions"], queryFn: getSubscriptions })
  const { data: letters, isLoading: lettersLoading } = useQuery({ queryKey: ["letters"], queryFn: getLetters })

  const cancellable = (subscriptions ?? []).filter((s) => s.status === "active" || s.status === "canceling")

  // Consume any prefill that was applied at mount (Cancel Lab certified-mail shortcut).
  useEffect(() => {
    if (lettersPrefill) setLettersPrefill(null)
  }, [lettersPrefill, setLettersPrefill])

  const generate = useMutation({
    mutationFn: () => createLetter(subscriptionId, templateType as TemplateType, locale),
    onSuccess: (letter) => {
      setTitle(letter.title)
      setContent(letter.content)
      queryClient.invalidateQueries({ queryKey: ["letters"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success(t("toastGenerated"))
    },
    onError: (err: Error) => toast.error(t("toastGenerateFailed", { error: err.message })),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] })
      toast.info(t("toastDeleted"))
    },
    onError: (err: Error) => toast.error(t("toastDeleteFailed", { error: err.message })),
  })

  function loadLetter(letter: LetterDTO) {
    setTitle(letter.title)
    setContent(letter.content)
    setSubscriptionId(letter.subscriptionId)
    setTemplateType(letter.templateType)
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    remove.mutate(id)
  }

  async function copyLetter() {
    if (!content.trim()) return
    try {
      await navigator.clipboard.writeText(content)
      toast.success(t("toastCopied"))
    } catch {
      toast.error(t("toastClipboard"))
    }
  }

  function downloadLetter() {
    if (!content.trim()) return
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(title || "subtract-letter").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success(t("toastDownloaded"))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Generator form */}
      <Card className="rounded-xl border-zinc-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("generateTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {cancellable.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("noCancellable")}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              <Select value={subscriptionId} onValueChange={setSubscriptionId}>
                <SelectTrigger aria-label={t("chooseSubscription")} className="w-full">
                  <SelectValue placeholder={t("chooseSubscription")} />
                </SelectTrigger>
                <SelectContent>
                  {cancellable.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={templateType}
                onValueChange={(v) => setTemplateType(v as TemplateType)}
              >
                <SelectTrigger aria-label={t("chooseTemplate")} className="w-full">
                  <SelectValue placeholder={t("chooseTemplate")} />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex flex-col">
                        <span>{t(`templates.${value}.label`)}</span>
                        <span className="text-xs text-muted-foreground">
                          {t(`templates.${value}.description`)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
                disabled={!subscriptionId || !templateType || generate.isPending}
                onClick={() => generate.mutate()}
              >
                {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {t("generate")}
              </Button>
            </div>
          )}
          {generate.isPending && <p className="mt-3 text-xs text-muted-foreground">{t("drafting")}</p>}
        </CardContent>
      </Card>

      {/* Editor */}
      {content || title ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200/80 border-s-4 border-s-red-600 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <FileText className="size-4 shrink-0 text-red-600" aria-hidden="true" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                {title || t("untitled")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="shadow-xs"
                onClick={copyLetter}
                disabled={!content.trim()}
              >
                <Copy className="size-3.5" />
                {t("copy")}
              </Button>
              <Button
                size="sm"
                className="bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700"
                onClick={downloadLetter}
                disabled={!content.trim()}
              >
                <Download className="size-3.5" />
                {t("download")}
              </Button>
            </div>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            aria-label={t("untitled")}
            className="min-h-[420px] resize-y rounded-none border-0 bg-local [background-position-y:20px] bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_31px,rgb(244_244_245)_31px,rgb(244_244_245)_32px)] px-6 py-5 font-mono text-[13px] leading-8 text-foreground shadow-none focus-visible:ring-0 sm:px-8"
            spellCheck={false}
          />
        </div>
      ) : (
        <EmptyPanel
          icon={FileText}
          title={t("noEditorTitle")}
          description={t("noEditorDescription")}
        />
      )}

      {/* Saved letters */}
      <Card className="rounded-xl border-zinc-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("savedTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {lettersLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : !letters || letters.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-sm text-muted-foreground">
              {t("savedEmpty")}
            </p>
          ) : (
            <ul className="subtract-scroll flex max-h-64 flex-col divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200/80">
              {letters.map((letter) => (
                <li key={letter.id}>
                  <button
                    type="button"
                    onClick={() => loadLetter(letter)}
                    className="flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-zinc-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200/60 bg-zinc-50 text-zinc-500">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{letter.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {letter.subscriptionName} ·{" "}
                        {format(new Date(letter.createdAt), "MMM d, yyyy", { locale: dateFnsLocale(locale) })}
                      </p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t("deleteAria", { title: letter.title })}
                      onClick={(e) => handleDelete(e, letter.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleDelete(e as unknown as React.MouseEvent, letter.id)
                      }}
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"
                    >
                      <Trash2 className="size-4" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
