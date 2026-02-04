import { db } from '~/server/database/client'
import { excelPresets } from '~/server/database/schema'
import { getTierLimits } from '~/server/utils/auth'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const createPresetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  columns: z.array(z.object({
    id: z.string(),
    field: z.string(),
    header: z.string(),
    width: z.number(),
    format: z.string(),
    enabled: z.boolean(),
    order: z.number(),
    customMapping: z.string().optional(),
  })),
  options: z.object({
    includeHeaderRow: z.boolean(),
    freezeHeaderRow: z.boolean(),
    autoFitColumns: z.boolean(),
    alternateRowColors: z.boolean(),
    enableWrapping: z.boolean(),
    headerStyle: z.object({
      bold: z.boolean(),
      backgroundColor: z.string(),
      textColor: z.string(),
      fontSize: z.number(),
    }),
    sortBy: z.array(z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    })),
    filters: z.record(z.unknown()),
    additionalSheets: z.object({
      summary: z.boolean(),
      tagBreakdown: z.boolean(),
      sourceTypeDistribution: z.boolean(),
      veritasDistribution: z.boolean(),
      timelineChart: z.boolean(),
    }),
  }),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const parsed = createPresetSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid preset data',
      data: parsed.error.flatten(),
    })
  }

  const limits = getTierLimits(user.subscriptionTier)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(excelPresets)
    .where(eq(excelPresets.userId, user.id))

  const currentCount = Number(countResult?.count ?? 0)
  if (currentCount >= limits.excelPresets) {
    throw createError({
      statusCode: 403,
      message: `You have reached the maximum number of custom presets (${limits.excelPresets}) for your subscription tier.`,
    })
  }

  const [newPreset] = await db
    .insert(excelPresets)
    .values({
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      columns: parsed.data.columns,
      options: parsed.data.options,
    })
    .returning()

  return {
    ...newPreset,
    isSystem: false,
  }
})
