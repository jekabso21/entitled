import type { z } from 'zod'
import { sendEmailJobSchema, sendEmailQueue } from './send-email-job.ts'

export const deadLetterQueue = 'dead-letter'

export const jobs = {
  [sendEmailQueue]: { schema: sendEmailJobSchema, retryLimit: 5, expireInSeconds: 60 },
} as const

export type JobName = keyof typeof jobs

export type JobData<TName extends JobName> = z.infer<(typeof jobs)[TName]['schema']>
