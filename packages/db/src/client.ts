import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { relations } from './relations.ts'

export function createPool(databaseUrl: string) {
  return new Pool({ connectionString: databaseUrl })
}

export function createDb(pool: Pool) {
  return drizzle({ client: pool, relations })
}

export type Db = ReturnType<typeof createDb>

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// Queries that work both standalone and inside a transaction take this.
export type Queryable = Db | Tx
