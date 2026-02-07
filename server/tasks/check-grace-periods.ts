import { processExpiredGracePeriods } from '~/server/api/admin/check-grace-periods.post'

export default defineTask({
  meta: {
    name: 'check-grace-periods',
    description: 'Downgrade users with expired grace periods to free tier',
  },
  async run() {
    const result = await processExpiredGracePeriods()
    return { result }
  },
})
