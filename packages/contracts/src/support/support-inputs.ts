import { z } from 'zod'
import { supportThreadStatusSchema } from './support-thread.ts'

export const MAX_SUPPORT_ATTACHMENT_BYTES = 25 * 1024 * 1024

const body = z.string().trim().min(1).max(50_000)
const attachmentIds = z.array(z.uuid()).max(10).default([])

export const createSupportThreadInputSchema = z.strictObject({
  // Required when the user belongs to several client accounts.
  clientAccountId: z.uuid().optional(),
  productId: z.uuid(),
  releaseId: z.uuid().nullable().default(null),
  subject: z.string().trim().min(3).max(200),
  body,
  attachmentIds,
})

export type CreateSupportThreadInput = z.infer<typeof createSupportThreadInputSchema>

export const postSupportMessageInputSchema = z.strictObject({
  body,
  internal: z.boolean().default(false),
  attachmentIds,
})

export type PostSupportMessageInput = z.infer<typeof postSupportMessageInputSchema>

export const updateSupportThreadInputSchema = z.strictObject({
  status: supportThreadStatusSchema,
})

export const createSupportAttachmentInputSchema = z.strictObject({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\]+$/, { error: 'File name must not contain path separators' }),
  contentType: z.string().trim().min(1).max(255).default('application/octet-stream'),
  sizeBytes: z.number().int().positive().max(MAX_SUPPORT_ATTACHMENT_BYTES),
})

export type CreateSupportAttachmentInput = z.infer<typeof createSupportAttachmentInputSchema>

export const supportAttachmentUploadSchema = z.object({
  attachmentId: z.uuid(),
  uploadUrl: z.url(),
  uploadHeaders: z.record(z.string(), z.string()),
})

export type SupportAttachmentUpload = z.infer<typeof supportAttachmentUploadSchema>

export const supportThreadListQuerySchema = z.object({
  status: supportThreadStatusSchema.optional(),
})
