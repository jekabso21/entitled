import { createDb } from '@entitled/db'
import { env } from '#config/env.ts'

export const db = createDb(env.DATABASE_URL)
