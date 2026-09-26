import { z } from 'zod'

export const vendorRoleSchema = z.enum(['admin', 'editor', 'support'])

export type VendorRole = z.infer<typeof vendorRoleSchema>
