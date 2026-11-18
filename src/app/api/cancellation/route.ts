import { db } from "@/lib/db"
import { monthlyNormalized } from "@/lib/catalog"
import { createNotification } from "@/lib/notifications"
import { loadSubscriptionDTO } from "@/lib/serialize"

export async function POST(request: Request) {
  let subscriptionId: unknown
  let action: unknown
  try {
    const body = (await request.json().catch(() => null)) as {
      subscriptionId?: unknown
      action?: unknown
    } | null
    subscriptionId = body?.subscriptionId
    action = body?.action
  } catch {
    subscriptionId = undefined
  }

  if (typeof subscriptionId !== "string" || !subscriptionId) {
    return Response.json({ error: "subscriptionId is required" }, { status: 400 })
  }
  if (action !== "start" && action !== "advance" && action !== "reset") {
    return Response.json({ error: 'action must be "start", "advance" or "reset"' }, { status: 400 })
  }

  try {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { cancellation: true },
    })
    if (!subscription) {
      return Response.json({ error: "Subscription not found" }, { status: 404 })
    }

    if (action === "start") {
      if (subscription.status !== "active") {
        return Response.json(
          { error: `Cannot start cancellation: subscription status is "${subscription.status}", expected "active"` },
          { status: 400 }
        )
      }
      if (subscription.cancellation) {
        return Response.json({ error: "Cancellation already started" }, { status: 400 })
      }
      await db.cancellation.create({
        data: { subscriptionId: subscription.id, status: "in_progress", currentStep: 1 },
      })
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "canceling" },
      })
      try {
        await createNotification(
          "cancellation_started",
          `cancel_started:${subscription.id}:${Date.now()}`,
          { name: subscription.name },
          subscription.id
        )
      } catch (notificationError) {
        console.error("Cancellation-started notification hook failed", notificationError)
      }
    }

    if (action === "advance") {
      if (!subscription.cancellation) {
        return Response.json({ error: "Cancellation has not been started" }, { status: 400 })
      }
      if (subscription.cancellation.status === "done") {
        return Response.json({ error: "Cancellation already completed" }, { status: 400 })
      }

      const steps = await db.cancelStep.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { order: "asc" },
      })
      const nextStep = steps.find((step) => !step.done)

      if (nextStep) {
        await db.cancelStep.update({
          where: { id: nextStep.id },
          data: { done: true },
        })
        const isLast = steps[steps.length - 1]?.id === nextStep.id
        if (isLast) {
          await db.cancellation.update({
            where: { subscriptionId: subscription.id },
            data: { status: "done", currentStep: steps.length + 1, completedAt: new Date() },
          })
          await db.subscription.update({
            where: { id: subscription.id },
            data: { status: "canceled" },
          })
          try {
            const monthly = monthlyNormalized(subscription.amount, subscription.cadence)
            await createNotification(
              "cancellation_completed",
              `killed:${subscription.id}:${Date.now()}`,
              { name: subscription.name, monthly: monthly.toFixed(2), annual: (monthly * 12).toFixed(2) },
              subscription.id
            )
          } catch (notificationError) {
            console.error("Cancellation-completed notification hook failed", notificationError)
          }
        } else {
          await db.cancellation.update({
            where: { subscriptionId: subscription.id },
            data: { currentStep: nextStep.order + 1 },
          })
        }
      } else {
        await db.cancellation.update({
          where: { subscriptionId: subscription.id },
          data: { status: "done", currentStep: steps.length + 1, completedAt: new Date() },
        })
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: "canceled" },
        })
        try {
          const monthly = monthlyNormalized(subscription.amount, subscription.cadence)
          await createNotification(
            "cancellation_completed",
            `killed:${subscription.id}:${Date.now()}`,
            { name: subscription.name, monthly: monthly.toFixed(2), annual: (monthly * 12).toFixed(2) },
            subscription.id
          )
        } catch (notificationError) {
          console.error("Cancellation-completed notification hook failed", notificationError)
        }
      }
    }

    if (action === "reset") {
      if (subscription.cancellation) {
        await db.cancellation.delete({ where: { subscriptionId: subscription.id } })
      }
      await db.cancelStep.updateMany({
        where: { subscriptionId: subscription.id },
        data: { done: false },
      })
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "active" },
      })
    }

    const dto = await loadSubscriptionDTO(subscription.id)
    if (!dto) {
      return Response.json({ error: "Subscription not found" }, { status: 404 })
    }
    return Response.json({ subscription: dto })
  } catch (error) {
    console.error("POST /api/cancellation failed", error)
    return Response.json({ error: "Cancellation action failed" }, { status: 500 })
  }
}
