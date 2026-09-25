import { z } from 'zod'

export const sendEmailQueue = 'email.send'

export const sendEmailJobSchema = z.strictObject({
  to: z.email(),
  subject: z.string().min(1).max(300),
  text: z.string().min(1),
  html: z.string().optional(),
})

export type SendEmailJob = z.infer<typeof sendEmailJobSchema>
