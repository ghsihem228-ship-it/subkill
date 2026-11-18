// SubKill — locale helpers shared by the i18n layer (date-fns locales, labels).
import { ar, enUS, fr, type Locale } from "date-fns/locale"

export type AppLocale = "en" | "fr" | "ar"

export const APP_LOCALES: AppLocale[] = ["en", "fr", "ar"]

// Short labels shown in the header language switcher (same in every locale).
export const LOCALE_SHORT_LABELS: Record<AppLocale, string> = {
  en: "EN",
  fr: "FR",
  ar: "عربي",
}

// Full names shown in the language switcher menu (endonyms, same in every locale).
export const LOCALE_NATIVE_NAMES: Record<AppLocale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
}

/**
 * BCP-47 tag passed to next-intl. Arabic uses the Algeria region so numbers
 * render with Western digits (latn), matching formatMoney's en-US output.
 */
export function intlLocale(locale: AppLocale): string {
  return locale === "ar" ? "ar-DZ" : locale
}

export function dateFnsLocale(locale: AppLocale): Locale {
  switch (locale) {
    case "fr":
      return fr
    case "ar":
      return ar
    default:
      return enUS
  }
}
