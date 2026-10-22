import { z } from 'zod'

export const docPageRevisionSummarySchema = z.object({
  id: z.uuid(),
  pageId: z.uuid(),
  title: z.string(),
  createdAt: z.iso.datetime(),
  createdByName: z.string().nullable(),
})

export type DocPageRevisionSummary = z.infer<typeof docPageRevisionSummarySchema>

export const docPageRevisionSchema = docPageRevisionSummarySchema.extend({ body: z.string() })

export type DocPageRevision = z.infer<typeof docPageRevisionSchema>
