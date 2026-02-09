import { getAllFeatureFlags } from '~/server/utils/feature-flags'

export default defineEventHandler(async () => {
  return getAllFeatureFlags()
})
