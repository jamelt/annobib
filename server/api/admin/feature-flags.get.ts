import { requireAdminOrSupport } from '~/server/utils/auth'
import { getAllFeatureFlags } from '~/server/utils/feature-flags'
import { TIER_IDS } from '~/shared/subscriptions'

export default defineEventHandler(async (event) => {
  await requireAdminOrSupport(event)

  const flags = getAllFeatureFlags()

  return {
    flags,
    source: 'environment-variables',
  }
})
