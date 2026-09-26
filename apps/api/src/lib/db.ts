import { createDb, createPool } from '@entitled/db'
import { env } from '#config/env.ts'

export const pool = createPool(env.DATABASE_URL)
export const db = createDb(pool)
