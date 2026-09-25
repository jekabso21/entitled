import { sendEmailQueue } from '@entitled/contracts/jobs'
import { PgBoss } from 'pg-boss'
import { env } from '#config/env.ts'
import { sendEmail } from '#handlers/send-email.ts'
import { registerQueues } from '#lib/queues.ts'

const boss = new PgBoss(env.DATABASE_URL)
boss.on('error', (err: unknown) => {
  console.error(err)
})

await boss.start()
await registerQueues(boss)
await boss.work(sendEmailQueue, sendEmail)
console.warn('worker started')

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void boss.stop({ graceful: true }).then(() => process.exit(0))
  })
}
