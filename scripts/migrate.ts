import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'

config()

const runMigrations = async () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  console.log('Running migrations...')

  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql)

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations completed successfully')
  }
  catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
  finally {
    await sql.end()
  }
}

const rollbackMigration = async (migrationName?: string) => {
  console.log('Rolling back migration:', migrationName || 'latest')
  console.warn('Note: Drizzle ORM does not have built-in rollback. Manual intervention required.')
  console.log('Please review the migration files and apply reversal SQL manually.')
  process.exit(0)
}

const command = process.argv[2]

switch (command) {
  case 'up':
    runMigrations()
    break
  case 'down':
    rollbackMigration(process.argv[3])
    break
  default:
    runMigrations()
}
