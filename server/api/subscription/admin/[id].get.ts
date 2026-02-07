import { db } from '~/server/database/client'
import { users, subscriptions } from '~/server/database/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAdminOrSupport } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminOrSupport(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      stripeCustomerId: true,
      subscriptionTier: true,
    },
  })

  if (!targetUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    orderBy: [desc(subscriptions.createdAt)],
  })

  return {
    tier: targetUser.subscriptionTier,
    stripeCustomerId: targetUser.stripeCustomerId,
    subscription: subscription
      ? {
          id: subscription.id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: subscription.status,
          tier: subscription.tier,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          graceEndsAt: subscription.graceEndsAt,
          lastPaymentError: subscription.lastPaymentError,
          stripePriceId: subscription.stripePriceId,
          unitAmount: subscription.unitAmount,
          billingInterval: subscription.billingInterval,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        }
      : null,
  }
})
