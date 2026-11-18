// SubKill — typed API client and shared DTO types matching the backend contract.

import type { AppLocale } from "@/lib/i18n"

export type SubscriptionStatus = "active" | "canceling" | "canceled" | "undetected"
export type Cadence = "monthly" | "yearly"
export type StepType = "digital" | "phone" | "mail" | "in_person"
export type TemplateType = "cancellation_demand" | "certified_mail" | "chargeback" | "ag_complaint"
export type SourceType = "bank" | "email" | "appstore"

export type StepDTO = {
  id: string
  order: number
  title: string
  description: string
  type: StepType
  hoop: boolean
  hoopScript: string | null
  estimatedMinutes: number
  done: boolean
}

export type CancellationDTO = {
  id: string
  status: string
  currentStep: number
  startedAt: string
  completedAt: string | null
}

export type SubscriptionDTO = {
  id: string
  slug: string
  name: string
  merchant: string
  amount: number
  cadence: Cadence
  category: string
  icon: string
  difficulty: number
  difficultyReason: string
  status: SubscriptionStatus
  detectedVia: SourceType
  nextCharge: string | null
  firstSeen: string | null
  notes: string
  cancellationMethod: string
  steps: StepDTO[]
  cancellation: CancellationDTO | null
}

export type AccountDTO = {
  id: string
  provider: string
  name: string
  type: SourceType
  status: string
  maskedRef: string
  connectedAt: string
}

export type TransactionDTO = {
  id: string
  merchant: string
  amount: number
  date: string
  description: string
  accountName: string
}

export type LetterDTO = {
  id: string
  subscriptionId: string
  subscriptionName: string
  templateType: TemplateType
  title: string
  content: string
  createdAt: string
}

export type ChatMessageDTO = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export type StatsDTO = {
  monthlySpend: number
  annualSpend: number
  activeCount: number
  hardCount: number
  canceledCount: number
  savedMonthly: number
  savedAnnual: number
  potentialMonthly: number
  byCategory: { category: string; amount: number }[]
  upcoming: {
    id: string
    name: string
    amount: number
    icon: string
    date: string
    daysUntil: number
  }[]
}

export type ScanDetectedItem = {
  slug: string
  name: string
  amount: number
  cadence: Cadence
  source: SourceType
  sourceName: string
  occurrences: number
}

export type ScanResult = {
  detected: ScanDetectedItem[]
  totalMonthly: number
  counts: { accounts: number; transactions: number; subscriptions: number }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (typeof body.error === "string" && body.error.length > 0) message = body.error
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

// ---- Accounts ----

export function getAccounts(): Promise<AccountDTO[]> {
  return request<{ accounts: AccountDTO[] }>("/api/accounts").then((r) => r.accounts)
}

export function connectAccount(
  provider: string
): Promise<{ account: AccountDTO; created: boolean; transactionCount: number }> {
  return request("/api/accounts", { method: "POST", body: JSON.stringify({ provider }) })
}

// ---- Subscriptions ----

export function getSubscriptions(): Promise<SubscriptionDTO[]> {
  return request<{ subscriptions: SubscriptionDTO[] }>("/api/subscriptions").then((r) => r.subscriptions)
}

export function getSubscriptionDetail(
  id: string
): Promise<{ subscription: SubscriptionDTO; transactions: TransactionDTO[] }> {
  return request(`/api/subscriptions/${id}`)
}

// ---- Scan ----

export function runScan(): Promise<ScanResult> {
  return request("/api/scan", { method: "POST" })
}

// ---- Stats ----

export function getStats(): Promise<StatsDTO> {
  return request("/api/stats")
}

// ---- Cancellation ----

export function cancellationAction(
  subscriptionId: string,
  action: "start" | "advance" | "reset"
): Promise<SubscriptionDTO> {
  return request<{ subscription: SubscriptionDTO }>("/api/cancellation", {
    method: "POST",
    body: JSON.stringify({ subscriptionId, action }),
  }).then((r) => r.subscription)
}

// ---- Letters ----

export function getLetters(): Promise<LetterDTO[]> {
  return request<{ letters: LetterDTO[] }>("/api/letters").then((r) => r.letters)
}

export function createLetter(
  subscriptionId: string,
  templateType: TemplateType,
  locale: AppLocale = "en"
): Promise<LetterDTO> {
  return request<{ letter: LetterDTO }>("/api/letters", {
    method: "POST",
    body: JSON.stringify({ subscriptionId, templateType, locale }),
  }).then((r) => r.letter)
}

export function deleteLetter(id: string): Promise<{ ok: boolean }> {
  return request(`/api/letters/${id}`, { method: "DELETE" })
}

// ---- Chat ----

export function getChat(): Promise<{ messages: ChatMessageDTO[]; intro?: string }> {
  return request("/api/chat")
}

export function sendChatMessage(message: string, locale: AppLocale = "en"): Promise<string> {
  return request<{ reply: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, locale }),
  }).then((r) => r.reply)
}

export function clearChat(): Promise<{ ok: boolean }> {
  return request("/api/chat", { method: "DELETE" })
}

// ---- Notifications ----

export type NotificationType =
  | "detection"
  | "cancellation_started"
  | "cancellation_completed"
  | "letter_generated"
  | "upcoming_charge"

export type NotificationDTO = {
  id: string
  type: NotificationType
  subscriptionId: string | null
  params: Record<string, string>
  read: boolean
  createdAt: string
}

export type NotificationsResponse = {
  notifications: NotificationDTO[]
  unreadCount: number
}

export function getNotifications(): Promise<NotificationsResponse> {
  return request("/api/notifications")
}

export function markAllNotificationsRead(): Promise<{ ok: boolean; unreadCount: number }> {
  return request("/api/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "read-all" }),
  })
}

export function clearNotifications(): Promise<{ ok: boolean }> {
  return request("/api/notifications", { method: "DELETE" })
}

// ---- Formatting helpers ----

export function monthlyNormalized(amount: number, cadence: Cadence): number {
  return cadence === "yearly" ? amount / 12 : amount
}

const usdFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function formatMoney(n: number): string {
  return usdFormatter.format(n)
}

export function formatMonthly(amount: number, cadence: Cadence): string {
  return `${formatMoney(monthlyNormalized(amount, cadence))}/mo`
}
