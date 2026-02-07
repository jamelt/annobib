import { requireAdminOrSupport } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAdminOrSupport(event)
  return { id: user.id, email: user.email, name: user.name, role: user.role }
})
