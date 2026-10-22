import { z } from 'zod'

// Shown inline in a page.
export const docMediaContentTypes = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
] as const

// Linked from a page for download. HTML and SVG stay out: served from storage they could
// run script on a shared origin.
export const docAttachmentContentTypes = [
  'application/pdf',
  'application/zip',
  'application/octet-stream',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

export const docAssetContentTypes = [...docMediaContentTypes, ...docAttachmentContentTypes] as const

export const MAX_DOC_ASSET_BYTES = 200 * 1024 * 1024

export const createDocAssetInputSchema = z.strictObject({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[\w.-]+$/, { error: 'Use letters, digits, dots, dashes or underscores' }),
  contentType: z.enum(docAssetContentTypes),
  sizeBytes: z.number().int().positive().max(MAX_DOC_ASSET_BYTES),
})

export type CreateDocAssetInput = z.infer<typeof createDocAssetInputSchema>

export const docAssetUploadSchema = z.object({
  assetId: z.uuid(),
  // Same-origin URL to embed in Markdown: ![alt](url).
  url: z.string(),
  uploadUrl: z.url(),
  uploadHeaders: z.record(z.string(), z.string()),
})

export type DocAssetUpload = z.infer<typeof docAssetUploadSchema>

export const docAssetSchema = z.object({
  id: z.uuid(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  url: z.string(),
  createdAt: z.iso.datetime(),
  // Pages whose Markdown links to this file; an empty list means it can be deleted.
  usedBy: z.array(z.object({ id: z.uuid(), title: z.string() })),
})

export type DocAsset = z.infer<typeof docAssetSchema>
