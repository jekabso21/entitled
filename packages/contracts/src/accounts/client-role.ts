import { z } from 'zod'

export const clientRoleSchema = z.enum(['admin', 'member'])

export type ClientRole = z.infer<typeof clientRoleSchema>
