import { db } from '~/server/database/client'
import { entries } from '~/server/database/schema'
import { generateBibtex } from '~/server/services/export'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Entry } from '~/shared/types'

const exportSchema = z.object({
  entryIds: z.array(z.string().uuid()).optional(),
  projectId: z.string().uuid().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const parsed = exportSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid export options',
      data: parsed.error.flatten(),
    })
  }

  const { entryIds } = parsed.data

  let userEntries = await db.query.entries.findMany({
    where: eq(entries.userId, user.id),
  })

  if (entryIds && entryIds.length > 0) {
    userEntries = userEntries.filter(e => entryIds.includes(e.id))
  }

  const bibtex = generateBibtex(userEntries as Entry[])

  setHeader(event, 'Content-Type', 'application/x-bibtex')
  setHeader(event, 'Content-Disposition', `attachment; filename="bibliography-${Date.now()}.bib"`)

  return bibtex
})
