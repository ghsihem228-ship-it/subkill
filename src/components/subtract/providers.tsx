"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import { Toaster } from "@/components/ui/sonner"
import arMessages from "@/locales/ar.json"
import enMessages from "@/locales/en.json"
import frMessages from "@/locales/fr.json"
import { intlLocale, type AppLocale } from "@/lib/i18n"
import { useLocaleStore } from "@/lib/store"

const MESSAGES: Record<AppLocale, typeof enMessages> = {
  en: enMessages,
  fr: frMessages,
  ar: arMessages,
}

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 10_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const locale = useLocaleStore((s) => s.locale)

  // Locale is read from localStorage / navigator.language, which the server
  // cannot know. Render the first (SSR + hydration) pass in English, then
  // switch to the client locale right after hydration to avoid mismatches.
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  }, [locale])

  const activeLocale = mounted ? locale : "en"

  return (
    <NextIntlClientProvider
      locale={intlLocale(activeLocale)}
      messages={MESSAGES[activeLocale]}
      timeZone="Africa/Algiers"
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="bottom-right" richColors closeButton={false} />
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}
