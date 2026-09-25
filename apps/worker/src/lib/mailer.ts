import { createTransport } from 'nodemailer'
import { env } from '#config/env.ts'

export const mailer = createTransport(env.SMTP_URL)
