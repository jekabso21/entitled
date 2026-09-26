import { runMigrations } from '../migrate.ts'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

await runMigrations(databaseUrl)
console.warn('migrations applied')
