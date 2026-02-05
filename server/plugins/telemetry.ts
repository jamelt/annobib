import { initTelemetry, recordHttpRequest } from '~/server/utils/telemetry'

export default defineNitroPlugin(async (nitroApp) => {
  if (process.env.NODE_ENV === 'production') {
    await initTelemetry()
  }

  nitroApp.hooks.hook('request', (event) => {
    event.context._requestStart = Date.now()
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const startTime = event.context._requestStart as number | undefined
    if (startTime) {
      const duration = Date.now() - startTime
      const method = event.method
      const path = event.path
      const statusCode = event.node.res.statusCode

      recordHttpRequest(method, path, statusCode, duration)
    }
  })
})
