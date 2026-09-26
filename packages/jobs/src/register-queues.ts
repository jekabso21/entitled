import type { PgBoss } from 'pg-boss'
import { deadLetterQueue, jobs } from './job-registry.ts'

export async function registerQueues(boss: PgBoss) {
  // The dead-letter queue must exist before any queue that points to it.
  await boss.createQueue(deadLetterQueue, { retentionSeconds: 14 * 24 * 3600 })
  for (const [name, { retryLimit, expireInSeconds }] of Object.entries(jobs)) {
    await boss.createQueue(name, {
      retryLimit,
      expireInSeconds,
      retryBackoff: true,
      deadLetter: deadLetterQueue,
    })
  }
}
