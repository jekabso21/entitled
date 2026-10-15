import { z } from 'zod'

export const supportThreadStatusSchema = z.enum(['open', 'waiting_on_client', 'resolved'])

export type SupportThreadStatus = z.infer<typeof supportThreadStatusSchema>

export const supportAttachmentSchema = z.object({
  id: z.uuid(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
})

export type SupportAttachment = z.infer<typeof supportAttachmentSchema>

export const supportMessageSchema = z.object({
  id: z.uuid(),
  authorName: z.string().nullable(),
  // True when written by vendor staff, so the UI can tell the two sides apart.
  fromVendor: z.boolean(),
  internal: z.boolean(),
  body: z.string(),
  bodyHtml: z.string(),
  attachments: z.array(supportAttachmentSchema),
  createdAt: z.iso.datetime(),
})

export type SupportMessage = z.infer<typeof supportMessageSchema>

export const supportThreadSummarySchema = z.object({
  id: z.uuid(),
  subject: z.string(),
  status: supportThreadStatusSchema,
  clientAccountId: z.uuid(),
  clientAccountName: z.string(),
  productId: z.uuid(),
  productName: z.string(),
  releaseId: z.uuid().nullable(),
  releaseVersion: z.string().nullable(),
  lastMessageAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export type SupportThreadSummary = z.infer<typeof supportThreadSummarySchema>

export const supportThreadSchema = supportThreadSummarySchema.extend({
  messages: z.array(supportMessageSchema),
})

export type SupportThread = z.infer<typeof supportThreadSchema>
