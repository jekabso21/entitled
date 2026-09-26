import { z } from 'zod'
import { clientRoleSchema } from './client-role.ts'
import { vendorRoleSchema } from './vendor-role.ts'

export const currentUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  vendorRole: vendorRoleSchema.nullable(),
  twoFactorEnabled: z.boolean(),
  memberships: z.array(
    z.object({
      clientAccountId: z.uuid(),
      clientAccountName: z.string(),
      role: clientRoleSchema,
    }),
  ),
})

export type CurrentUser = z.infer<typeof currentUserSchema>
