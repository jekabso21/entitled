import { sendEmailQueue } from '@entitled/contracts/jobs'
import type { PgBoss } from 'pg-boss'

const deadLetterQueue = 'dead-letter'

const queues = [{ name: sendEmailQueue, retryLimit: 5, expireInSeconds: 60 }] as const

export async function registerQueues(boss: PgBoss) {
  // The dead-letter queue must exist before any queue that points to it.
  await boss.createQueue(deadLetterQueue, { retentionSeconds: 14 * 24 * 3600 })
  for (const { name, ...options } of queues) {
    await boss.createQueue(name, { ...options, retryBackoff: true, deadLetter: deadLetterQueue })
  }
}
