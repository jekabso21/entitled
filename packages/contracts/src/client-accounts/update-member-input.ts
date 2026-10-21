import { z } from 'zod'
import { clientRoleSchema } from '../accounts/client-role.ts'

export const updateMemberInputSchema = z.strictObject({ role: clientRoleSchema })
