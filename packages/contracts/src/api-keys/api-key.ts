import { z } from 'zod'

export const apiKeySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  // The first characters of the key, so people can tell keys apart without seeing them.
  start: z.string().nullable(),
  ownerEmail: z.email().nullable(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().nullable(),
  lastUsedAt: z.iso.datetime().nullable(),
})

export type ApiKey = z.infer<typeof apiKeySchema>

export const createApiKeyInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).nullable().default(null),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>

// The only response that ever contains the secret; it is not stored in plain text.
export const createdApiKeySchema = apiKeySchema.extend({ key: z.string() })

export type CreatedApiKey = z.infer<typeof createdApiKeySchema>
