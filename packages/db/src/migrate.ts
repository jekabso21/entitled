import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createDb, createPool } from './client.ts'

const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url))

export async function runMigrations(databaseUrl: string) {
  const pool = createPool(databaseUrl)
  try {
    await migrate(createDb(pool), { migrationsFolder })
  } finally {
    await pool.end()
  }
}
