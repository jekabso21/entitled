import { z } from 'zod'

export const hardwareRevisionSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  position: z.number().int(),
})

export type HardwareRevision = z.infer<typeof hardwareRevisionSchema>

export const productSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  revisions: z.array(hardwareRevisionSchema),
  createdAt: z.iso.datetime(),
})

export type Product = z.infer<typeof productSchema>
