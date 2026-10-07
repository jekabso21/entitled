import { createDb, createPool } from '@entitled/db'
import { env } from '#config/env.ts'

export const db = createDb(createPool(env.DATABASE_URL))
