import { db } from "@/lib/db"
import type { Account, CancelStep, Cancellation, Letter, Subscription, Transaction } from "@prisma/client"

export type SubscriptionWithRelations = Subscription & {
  steps: CancelStep[]
  cancellation: Cancellation | null
}

export function serializeStep(step: CancelStep) {
  return {
    id: step.id,
    order: step.order,
    title: step.title,
    description: step.description,
    type: step.type,
    hoop: step.hoop,
    hoopScript: step.hoopScript,
    estimatedMinutes: step.estimatedMinutes,
    done: step.done,
  }
}

export function serializeCancellation(cancellation: Cancellation) {
  return {
    id: cancellation.id,
    status: cancellation.status,
    currentStep: cancellation.currentStep,
    startedAt: cancellation.startedAt.toISOString(),
    completedAt: cancellation.completedAt ? cancellation.completedAt.toISOString() : null,
  }
}

export function serializeSubscription(sub: SubscriptionWithRelations) {
  return {
    id: sub.id,
    slug: sub.slug,
    name: sub.name,
    merchant: sub.merchant,
    amount: sub.amount,
    cadence: sub.cadence,
    category: sub.category,
    icon: sub.icon,
    difficulty: sub.difficulty,
    difficultyReason: sub.difficultyReason,
    status: sub.status,
    detectedVia: sub.detectedVia,
    nextCharge: sub.nextCharge.toISOString(),
    firstSeen: sub.firstSeen.toISOString(),
    notes: sub.notes,
    cancellationMethod: sub.cancellationMethod,
    steps: sub.steps.map(serializeStep),
    cancellation: sub.cancellation ? serializeCancellation(sub.cancellation) : null,
  }
}

export function serializeAccount(account: Account) {
  return {
    id: account.id,
    provider: account.provider,
    name: account.name,
    type: account.type,
    status: account.status,
    maskedRef: account.maskedRef,
    connectedAt: account.connectedAt.toISOString(),
  }
}

export function serializeLetter(letter: Letter & { subscription: Subscription | null }) {
  return {
    id: letter.id,
    subscriptionId: letter.subscriptionId,
    subscriptionName: letter.subscription?.name ?? "",
    templateType: letter.templateType,
    title: letter.title,
    content: letter.content,
    createdAt: letter.createdAt.toISOString(),
  }
}

export function serializeTransaction(txn: Transaction & { account: Account | null }) {
  return {
    id: txn.id,
    merchant: txn.merchant,
    amount: txn.amount,
    date: txn.date.toISOString(),
    description: txn.description,
    accountName: txn.account?.name ?? "",
  }
}

export async function loadSubscriptionDTO(id: string) {
  const sub = await db.subscription.findUnique({
    where: { id },
    include: { steps: { orderBy: { order: "asc" } }, cancellation: true },
  })
  return sub ? serializeSubscription(sub) : null
}

export async function loadSubscriptionDTOs() {
  const subs = await db.subscription.findMany({
    where: { status: { not: "undetected" } },
    include: { steps: { orderBy: { order: "asc" } }, cancellation: true },
  })
  subs.sort((a, b) => b.difficulty - a.difficulty || b.amount - a.amount)
  return subs.map(serializeSubscription)
}
