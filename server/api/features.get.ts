import { getAllFeatureFlags, type FeatureFlagContext } from '~/server/utils/feature-flags'
import { DEFAULT_TIER } from '~/shared/subscriptions'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event).catch(() => null)
  
  const context: FeatureFlagContext = {
    userId: user?.id,
    subscriptionTier: user?.subscriptionTier || DEFAULT_TIER,
    environment: process.env.NODE_ENV,
  }
  
  return getAllFeatureFlags(context)
})
