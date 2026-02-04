import { db } from '~/server/database/client'
import { tags, entryTags } from '~/server/database/schema'
import { eq, sql, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      description: tags.description,
      createdAt: tags.createdAt,
      entryCount: sql<number>`(
        SELECT COUNT(*) FROM ${entryTags}
        WHERE ${entryTags.tagId} = ${tags.id}
      )`,
    })
    .from(tags)
    .where(eq(tags.userId, user.id))
    .orderBy(asc(tags.name))

  return userTags.map(t => ({
    ...t,
    entryCount: Number(t.entryCount),
  }))
})
