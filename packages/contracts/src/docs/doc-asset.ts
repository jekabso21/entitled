import { z } from 'zod'

export const docAssetContentTypes = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
] as const

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
