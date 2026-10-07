import type { z } from 'zod'
import { artifactChecksumJobSchema, artifactChecksumQueue } from './artifact-checksum-job.ts'
import { sendEmailJobSchema, sendEmailQueue } from './send-email-job.ts'

export const deadLetterQueue = 'dead-letter'

export const jobs = {
  [sendEmailQueue]: { schema: sendEmailJobSchema, retryLimit: 5, expireInSeconds: 60 },
  // Hashing streams the whole object, so large firmware images get a generous timeout.
  [artifactChecksumQueue]: {
    schema: artifactChecksumJobSchema,
    retryLimit: 3,
    expireInSeconds: 3600,
  },
} as const

export type JobName = keyof typeof jobs

export type JobData<TName extends JobName> = z.infer<(typeof jobs)[TName]['schema']>
