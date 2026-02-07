import { db } from '~/server/database/client'
import { projects } from '~/server/database/schema'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const starredProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      color: projects.color,
      slug: projects.slug,
      isStarred: projects.isStarred,
    })
    .from(projects)
    .where(
      and(
        eq(projects.userId, user.id),
        eq(projects.isStarred, true),
        eq(projects.isArchived, false),
      ),
    )
    .orderBy(projects.name)

  return starredProjects
})
