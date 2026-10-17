import { z } from 'zod'
import { slugSchema } from '../client-accounts/create-client-account-input.ts'

export const docPageStatusSchema = z.enum(['draft', 'published'])

export const docPageSummarySchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  slug: z.string(),
  title: z.string(),
  status: docPageStatusSchema,
  position: z.number().int(),
  updatedAt: z.iso.datetime(),
})

export type DocPageSummary = z.infer<typeof docPageSummarySchema>

export const docPageSchema = docPageSummarySchema.extend({
  body: z.string(),
  bodyHtml: z.string(),
})

export type DocPage = z.infer<typeof docPageSchema>

const body = z.string().max(500_000)

export const createDocPageInputSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema.optional(),
  body: body.default(''),
})

export type CreateDocPageInput = z.infer<typeof createDocPageInputSchema>

export const updateDocPageInputSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(200),
    slug: slugSchema,
    body,
    status: docPageStatusSchema,
    position: z.number().int().min(0).max(10_000),
  })
  .partial()

export type UpdateDocPageInput = z.infer<typeof updateDocPageInputSchema>

export const importDocPageInputSchema = z.strictObject({
  fileName: z.string().trim().min(1).max(255),
  markdown: body,
})

export type ImportDocPageInput = z.infer<typeof importDocPageInputSchema>
