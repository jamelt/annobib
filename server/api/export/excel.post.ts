import { db } from '~/server/database/client'
import { entries, entryTags, tags, annotations, veritasScores, excelPresets } from '~/server/database/schema'
import { generateExcel, getPresetById, systemPresets } from '~/server/services/export'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import type { Entry } from '~/shared/types'

const exportSchema = z.object({
  entryIds: z.array(z.string().uuid()).optional(),
  projectId: z.string().uuid().optional(),
  presetId: z.string().optional(),
  customColumns: z.array(z.object({
    id: z.string(),
    field: z.string(),
    header: z.string(),
    width: z.number(),
    format: z.string(),
    enabled: z.boolean(),
    order: z.number(),
  })).optional(),
  customOptions: z.object({
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
  }).optional(),
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

  const { entryIds, projectId, presetId, customColumns, customOptions } = parsed.data

  let preset = getPresetById(presetId || 'standard') || systemPresets[0]

  if (presetId && !getPresetById(presetId)) {
    const userPreset = await db.query.excelPresets.findFirst({
      where: and(
        eq(excelPresets.id, presetId),
        eq(excelPresets.userId, user.id),
      ),
    })

    if (userPreset) {
      preset = {
        id: userPreset.id,
        name: userPreset.name,
        description: userPreset.description || '',
        isSystem: false,
        columns: userPreset.columns,
        options: userPreset.options,
      }
    }
  }

  if (customColumns) {
    preset = { ...preset, columns: customColumns }
  }
  if (customOptions) {
    preset = { ...preset, options: customOptions }
  }

  let userEntries = await db.query.entries.findMany({
    where: eq(entries.userId, user.id),
  })

  if (entryIds && entryIds.length > 0) {
    userEntries = userEntries.filter(e => entryIds.includes(e.id))
  }

  const entryIdList = userEntries.map(e => e.id)

  const [entryTagsData, entryAnnotationsData, entryVeritasData] = await Promise.all([
    entryIdList.length > 0
      ? db
          .select({
            entryId: entryTags.entryId,
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
          })
          .from(entryTags)
          .innerJoin(tags, eq(entryTags.tagId, tags.id))
          .where(inArray(entryTags.entryId, entryIdList))
      : [],
    entryIdList.length > 0
      ? db.query.annotations.findMany({
          where: inArray(annotations.entryId, entryIdList),
        })
      : [],
    entryIdList.length > 0
      ? db.query.veritasScores.findMany({
          where: inArray(veritasScores.entryId, entryIdList),
        })
      : [],
  ])

  const tagsByEntry = entryTagsData.reduce((acc, tag) => {
    if (!acc[tag.entryId]) acc[tag.entryId] = []
    acc[tag.entryId].push({
      id: tag.tagId,
      name: tag.tagName,
      color: tag.tagColor || '#6B7280',
    })
    return acc
  }, {} as Record<string, Array<{ id: string; name: string; color: string }>>)

  const annotationsByEntry = entryAnnotationsData.reduce((acc, ann) => {
    if (!acc[ann.entryId]) acc[ann.entryId] = []
    acc[ann.entryId].push(ann)
    return acc
  }, {} as Record<string, typeof entryAnnotationsData>)

  const veritasByEntry = entryVeritasData.reduce((acc, v) => {
    acc[v.entryId] = v
    return acc
  }, {} as Record<string, typeof entryVeritasData[0]>)

  const enrichedEntries: Entry[] = userEntries.map(e => ({
    ...e,
    tags: tagsByEntry[e.id] || [],
    annotations: annotationsByEntry[e.id] || [],
    veritasScore: veritasByEntry[e.id],
  } as Entry))

  const buffer = await generateExcel(enrichedEntries, preset)

  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="bibliography-${Date.now()}.xlsx"`)

  return buffer
})
