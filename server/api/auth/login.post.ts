import { db } from '~/server/database/client'
import { users } from '~/server/database/schema'
import { eq, and, like } from 'drizzle-orm'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0]?.message || 'Invalid input',
    })
  }

  const { email, password } = parsed.data
  const hashedPassword = await hashPassword(password)

  const user = await db.query.users.findFirst({
    where: and(
      eq(users.email, email.toLowerCase()),
      like(users.auth0Id, `local:${hashedPassword}`),
    ),
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
})

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
