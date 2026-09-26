import { registerQueues } from '@entitled/jobs'
import { PgBoss } from 'pg-boss'
import { env } from '#config/env.ts'

// The API only enqueues; maintenance and scheduling run in the worker.
const boss = new PgBoss({ connectionString: env.DATABASE_URL, supervise: false, schedule: false })
boss.on('error', (err: unknown) => {
  console.error(err)
})

let started: Promise<PgBoss> | undefined

export function getQueue() {
  started ??= boss.start().then(async () => {
    await registerQueues(boss)
    return boss
  })
  return started
}
