import { sendEmailJobSchema } from '@entitled/contracts/jobs'
import type { Job } from 'pg-boss'
import { env } from '#config/env.ts'
import { mailer } from '#lib/mailer.ts'

export async function sendEmail(jobs: Job<unknown>[]) {
  for (const job of jobs) {
    const email = sendEmailJobSchema.parse(job.data)
    await mailer.sendMail({ from: env.MAIL_FROM, ...email })
  }
}
