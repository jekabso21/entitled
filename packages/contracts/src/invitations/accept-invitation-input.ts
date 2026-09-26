import { z } from 'zod'
import { passwordSchema } from '../accounts/password.ts'

export const acceptInvitationInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  password: passwordSchema,
})

export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>
