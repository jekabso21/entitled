import { z } from 'zod'
import { vendorRoleSchema } from './vendor-role.ts'

export const vendorStaffMemberSchema = z.object({
  userId: z.uuid(),
  name: z.string(),
  email: z.email(),
  vendorRole: vendorRoleSchema,
  twoFactorEnabled: z.boolean(),
})

export type VendorStaffMember = z.infer<typeof vendorStaffMemberSchema>

// null removes vendor access entirely.
export const updateVendorStaffInputSchema = z.strictObject({
  vendorRole: vendorRoleSchema.nullable(),
})
