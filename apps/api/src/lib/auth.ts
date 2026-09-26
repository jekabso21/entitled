import { apiKey } from '@better-auth/api-key'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { betterAuth } from 'better-auth'
import { organization, twoFactor } from 'better-auth/plugins'
import { env } from '#config/env.ts'
import { db } from '#lib/db.ts'

export const auth = betterAuth({
  appName: 'Entitled',
  baseURL: env.API_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.WEB_URL],
  database: drizzleAdapter(db, { provider: 'pg', usePlural: true }),
  // Accounts are invite-only: users are created when they accept an invitation (see features/invitations).
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
  user: {
    additionalFields: {
      vendorRole: { type: 'string', required: false, input: false },
    },
  },
  rateLimit: { storage: 'database' },
  advanced: { database: { generateId: 'uuid' } },
  telemetry: { enabled: false },
  plugins: [
    organization({ allowUserToCreateOrganization: false }),
    twoFactor({ issuer: 'Entitled' }),
    apiKey({ defaultPrefix: 'ent_' }),
  ],
})

export type AuthSession = typeof auth.$Infer.Session
