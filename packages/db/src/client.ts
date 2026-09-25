import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { relations } from './relations.ts'

export function createDb(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl })
  return drizzle({ client: pool, relations })
}

export type Db = ReturnType<typeof createDb>
