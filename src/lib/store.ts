// SubKill — global UI state (tab routing + deep-link prefill targets) + persisted locale.
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { TemplateType } from "@/lib/api"
import type { AppLocale } from "@/lib/i18n"

export type TabId = "dashboard" | "subscriptions" | "cancel-lab" | "letters" | "chat"

export type LettersPrefill = {
  subscriptionId: string
  templateType: TemplateType
}

type SubtractStore = {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  cancelLabSubId: string | null
  setCancelLabSub: (id: string | null) => void
  lettersPrefill: LettersPrefill | null
  setLettersPrefill: (prefill: LettersPrefill | null) => void
  connectOpen: boolean
  setConnectOpen: (open: boolean) => void
  openCancelLab: (subscriptionId: string) => void
  openLetters: (prefill: LettersPrefill) => void
}

export const useSubtractStore = create<SubtractStore>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),
  cancelLabSubId: null,
  setCancelLabSub: (id) => set({ cancelLabSubId: id }),
  lettersPrefill: null,
  setLettersPrefill: (prefill) => set({ lettersPrefill: prefill }),
  connectOpen: false,
  setConnectOpen: (open) => set({ connectOpen: open }),
  openCancelLab: (subscriptionId) => set({ cancelLabSubId: subscriptionId, activeTab: "cancel-lab" }),
  openLetters: (prefill) => set({ lettersPrefill: prefill, activeTab: "letters" }),
}))

// ---- Locale (persisted separately so the main store keeps its exact shape) ----

function detectInitialLocale(): AppLocale {
  if (typeof navigator !== "undefined") {
    const lang = (navigator.language ?? "en").toLowerCase()
    if (lang.startsWith("fr")) return "fr"
    if (lang.startsWith("ar")) return "ar"
  }
  return "en"
}

type LocaleStore = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: detectInitialLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "subtract-locale",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ locale: state.locale }),
    }
  )
)
