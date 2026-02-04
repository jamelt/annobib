import { db } from '~/server/database/client'
import { projects } from '~/server/database/schema'
import { createProjectSchema } from '~/shared/validation'
import { getTierLimits } from '~/server/utils/auth'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid project data',
      data: parsed.error.flatten(),
    })
  }

  const limits = getTierLimits(user.subscriptionTier)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.userId, user.id))

  const currentCount = Number(countResult?.count ?? 0)
  if (currentCount >= limits.projects) {
    throw createError({
      statusCode: 403,
      message: `You have reached the maximum number of projects (${limits.projects}) for your subscription tier. Please upgrade to add more.`,
    })
  }

  const [newProject] = await db
    .insert(projects)
    .values({
      userId: user.id,
      ...parsed.data,
    })
    .returning()

  return {
    ...newProject,
    entryCount: 0,
  }
})
