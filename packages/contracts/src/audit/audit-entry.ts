import { z } from 'zod'

export const auditEntrySchema = z.object({
  id: z.uuid(),
  action: z.string(),
  subjectType: z.string(),
  subjectId: z.uuid().nullable(),
  actorEmail: z.string().nullable(),
  viaApiKey: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime(),
})

export type AuditEntry = z.infer<typeof auditEntrySchema>

export const auditPageSchema = z.object({
  entries: z.array(auditEntrySchema),
  // Ids are UUIDv7, so they sort by time; the cursor is the last id of the page.
  nextCursor: z.uuid().nullable(),
})

export type AuditPage = z.infer<typeof auditPageSchema>

export const auditQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().max(100).optional(),
})
