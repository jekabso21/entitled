import { env } from '#config/env.ts'

export const webOrigins: readonly string[] = [
  ...new Set([env.WEB_URL, ...env.TRUSTED_ORIGINS].map((url) => new URL(url).origin)),
]
