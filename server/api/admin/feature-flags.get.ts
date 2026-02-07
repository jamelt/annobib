import { requireAdminOrSupport } from '~/server/utils/auth'
import { getAllFeatureFlags, type FeatureFlagContext } from '~/server/utils/feature-flags'

export default defineEventHandler(async (event) => {
  await requireAdminOrSupport(event)

  const defaultContext: FeatureFlagContext = {
    environment: process.env.NODE_ENV,
  }

  const flags = getAllFeatureFlags(defaultContext)

  const tiers = ['free', 'light', 'pro'] as const
  const flagsByTier: Record<string, Record<string, boolean>> = {}

  for (const tier of tiers) {
    flagsByTier[tier] = getAllFeatureFlags({
      ...defaultContext,
      subscriptionTier: tier,
    })
  }

  return {
    flags,
    flagsByTier,
    unleashConfigured: !!(process.env.UNLEASH_URL && process.env.UNLEASH_API_TOKEN),
  }
})
