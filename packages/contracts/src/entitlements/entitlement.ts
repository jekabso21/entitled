import { z } from 'zod'

export const entitlementSchema = z.object({
  id: z.uuid(),
  clientAccountId: z.uuid(),
  productId: z.uuid(),
  productName: z.string(),
  // Empty means every revision of the product, including ones added later.
  revisionIds: z.array(z.uuid()),
  createdAt: z.iso.datetime(),
})

export type Entitlement = z.infer<typeof entitlementSchema>
