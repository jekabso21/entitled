import { createRoute, z } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { createRouter } from '#lib/create-router.ts'
import { db } from '#lib/db.ts'

const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.boolean(),
})

const route = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Liveness and database connectivity',
  responses: {
    200: {
      description: 'Service is up',
      content: { 'application/json': { schema: healthSchema } },
    },
    503: {
      description: 'Database unreachable',
      content: { 'application/json': { schema: healthSchema } },
    },
  },
})

export const getHealth = createRouter().openapi(route, async (c) => {
  const database = await db
    .execute(sql`select 1`)
    .then(() => true)
    .catch(() => false)
  return database
    ? c.json({ status: 'ok' as const, database }, 200)
    : c.json({ status: 'degraded' as const, database }, 503)
})
