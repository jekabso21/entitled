import { z } from 'zod'
import { clientRoleSchema } from '../accounts/client-role.ts'
import { vendorRoleSchema } from '../accounts/vendor-role.ts'

export const invitationSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  kind: z.enum(['vendor', 'client']),
  vendorRole: vendorRoleSchema.nullable(),
  clientAccountId: z.uuid().nullable(),
  clientRole: clientRoleSchema.nullable(),
  expiresAt: z.iso.datetime(),
  acceptedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})

export type Invitation = z.infer<typeof invitationSchema>

export const invitationPreviewSchema = z.object({
  email: z.email(),
  kind: z.enum(['vendor', 'client']),
  accountName: z.string().nullable(),
  expiresAt: z.iso.datetime(),
})

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>
