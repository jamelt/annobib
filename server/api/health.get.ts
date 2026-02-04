import { db } from '~/server/database/client'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const startTime = Date.now()

  const checks: Record<string, { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> = {
    database: { status: 'healthy' },
  }

  try {
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1`)
    checks.database.latency = Date.now() - dbStart
  }
  catch (error: any) {
    checks.database.status = 'unhealthy'
    checks.database.error = error.message
  }

  const overallStatus = Object.values(checks).every(c => c.status === 'healthy')
    ? 'healthy'
    : 'unhealthy'

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    latency: Date.now() - startTime,
    checks,
  }

  if (overallStatus === 'unhealthy') {
    throw createError({
      statusCode: 503,
      message: 'Service unhealthy',
      data: response,
    })
  }

  return response
})
