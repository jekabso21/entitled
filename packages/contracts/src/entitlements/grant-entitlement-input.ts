import { z } from 'zod'

export const grantEntitlementInputSchema = z.strictObject({
  clientAccountId: z.uuid(),
  productId: z.uuid(),
  revisionIds: z.array(z.uuid()).max(100).default([]),
})

export type GrantEntitlementInput = z.infer<typeof grantEntitlementInputSchema>
