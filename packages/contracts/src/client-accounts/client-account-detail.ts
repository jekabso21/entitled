import { z } from 'zod'
import { clientRoleSchema } from '../accounts/client-role.ts'

export const clientAccountDetailSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.iso.datetime(),
  members: z.array(
    z.object({
      userId: z.uuid(),
      name: z.string(),
      email: z.email(),
      role: clientRoleSchema,
    }),
  ),
})

export type ClientAccountDetail = z.infer<typeof clientAccountDetailSchema>
