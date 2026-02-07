import { db } from '~/server/database/client'
import { users, entries, projects, subscriptions, feedback } from '~/server/database/schema'
import { eq, count } from 'drizzle-orm'
import { requireAdminOrSupport } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminOrSupport(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'User ID is required' })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      subscription: true,
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const [entryCount, projectCount, feedbackCount] = await Promise.all([
    db.select({ count: count() }).from(entries).where(eq(entries.userId, userId)),
    db.select({ count: count() }).from(projects).where(eq(projects.userId, userId)),
    db.select({ count: count() }).from(feedback).where(eq(feedback.userId, userId)),
  ])

  return {
    ...user,
    auth0Id: undefined,
    stats: {
      entries: entryCount[0]?.count ?? 0,
      projects: projectCount[0]?.count ?? 0,
      feedbackSubmitted: feedbackCount[0]?.count ?? 0,
    },
  }
})
