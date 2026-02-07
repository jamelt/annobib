import { db } from '~/server/database/client'
import { users, entries, projects, subscriptions, feedback } from '~/server/database/schema'
import { eq, count, sql, and, gte } from 'drizzle-orm'
import { requireAdmin } from '~/server/utils/auth'
import { STRIPE_PRODUCTS } from '~/server/services/stripe'

const MONTHLY_PRICES: Record<string, number> = {
  light: STRIPE_PRODUCTS.light.priceMonthly,
  pro: STRIPE_PRODUCTS.pro.priceMonthly,
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsersResult,
    newUsersThisMonthResult,
    newUsersThisWeekResult,
    totalEntriesResult,
    totalProjectsResult,
    tierBreakdown,
    activeSubscriptionsResult,
    activeTierBreakdown,
    openFeedbackResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(entries),
    db.select({ count: count() }).from(projects),
    db.select({
      tier: users.subscriptionTier,
      count: count(),
    }).from(users).groupBy(users.subscriptionTier),
    db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
    db.select({
      tier: subscriptions.tier,
      count: count(),
    }).from(subscriptions).where(eq(subscriptions.status, 'active')).groupBy(subscriptions.tier),
    db.select({ count: count() }).from(feedback).where(eq(feedback.status, 'open')),
  ])

  const tiers: Record<string, number> = { free: 0, light: 0, pro: 0 }
  for (const row of tierBreakdown) {
    tiers[row.tier] = row.count
  }

  let mrrCents = 0
  for (const row of activeTierBreakdown) {
    const pricePerMonth = MONTHLY_PRICES[row.tier] ?? 0
    mrrCents += pricePerMonth * row.count
  }

  return {
    users: {
      total: totalUsersResult[0]?.count ?? 0,
      newThisMonth: newUsersThisMonthResult[0]?.count ?? 0,
      newThisWeek: newUsersThisWeekResult[0]?.count ?? 0,
    },
    content: {
      totalEntries: totalEntriesResult[0]?.count ?? 0,
      totalProjects: totalProjectsResult[0]?.count ?? 0,
    },
    subscriptions: {
      active: activeSubscriptionsResult[0]?.count ?? 0,
      byTier: tiers,
      mrr: mrrCents / 100,
    },
    feedback: {
      open: openFeedbackResult[0]?.count ?? 0,
    },
  }
})
