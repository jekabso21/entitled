import { z } from 'zod'
import { clientRoleSchema } from '../accounts/client-role.ts'
import { vendorRoleSchema } from '../accounts/vendor-role.ts'

const email = z.email().trim().toLowerCase()

export const createInvitationInputSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('vendor'), email, vendorRole: vendorRoleSchema }),
  z.strictObject({
    kind: z.literal('client'),
    email,
    clientAccountId: z.uuid(),
    clientRole: clientRoleSchema,
  }),
])

export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>
