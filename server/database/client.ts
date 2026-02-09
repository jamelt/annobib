import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://annobib:annobib@localhost:5432/annobib'

const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })

export type Database = typeof db

process.on('SIGTERM', async () => {
  await client.end({ timeout: 5 })
})

process.on('SIGINT', async () => {
  await client.end({ timeout: 5 })
})
