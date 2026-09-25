import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  SMTP_URL: z.url(),
  MAIL_FROM: z.string().min(3),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
