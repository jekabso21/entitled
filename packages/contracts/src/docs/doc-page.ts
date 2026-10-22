import { z } from 'zod'
import { slugSchema } from '../client-accounts/create-client-account-input.ts'

export const docPageStatusSchema = z.enum(['draft', 'published'])

// Pages nest as section → page → sub-page; deeper trees get hard to navigate.
export const MAX_DOC_PAGE_DEPTH = 3

export const docPageSummarySchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  parentId: z.uuid().nullable(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  status: docPageStatusSchema,
  position: z.number().int(),
  updatedAt: z.iso.datetime(),
})

export type DocPageSummary = z.infer<typeof docPageSummarySchema>

export const docHeadingSchema = z.object({
  id: z.string(),
  text: z.string(),
  depth: z.number().int(),
})

export type DocHeading = z.infer<typeof docHeadingSchema>

export const docPageSchema = docPageSummarySchema.extend({
  body: z.string(),
  bodyHtml: z.string(),
  // Section headings in reading order, for the "On this page" list.
  headings: z.array(docHeadingSchema),
  // Vendor staff only; clients see when a page changed, not who changed it.
  updatedByName: z.string().nullable(),
})

export type DocPage = z.infer<typeof docPageSchema>

const body = z.string().max(500_000)
const description = z.string().trim().max(300)

export const createDocPageInputSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  slug: slugSchema.optional(),
  body: body.default(''),
  description: description.default(''),
  parentId: z.uuid().nullable().optional(),
})

export type CreateDocPageInput = z.infer<typeof createDocPageInputSchema>

export const updateDocPageInputSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(200),
    slug: slugSchema,
    description,
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

// The whole tree in reading order: siblings appear in the order they should be shown.
export const reorderDocPagesInputSchema = z.strictObject({
  pages: z
    .array(z.strictObject({ id: z.uuid(), parentId: z.uuid().nullable() }))
    .min(1)
    .max(2000),
})

export type ReorderDocPagesInput = z.infer<typeof reorderDocPagesInputSchema>

// Imported pages arrive flat in reading order; `depth` 0 is a top-level page (or a child of
// `parentId`), and each page nests under the closest earlier page one level up.
export const importDocPagesInputSchema = z.strictObject({
  parentId: z.uuid().nullable().default(null),
  status: docPageStatusSchema.default('draft'),
  pages: z
    .array(
      z.strictObject({
        title: z.string().trim().min(1).max(200),
        body,
        depth: z
          .number()
          .int()
          .min(0)
          .max(MAX_DOC_PAGE_DEPTH - 1),
      }),
    )
    .min(1)
    .max(500),
})

export type ImportDocPagesInput = z.infer<typeof importDocPagesInputSchema>
