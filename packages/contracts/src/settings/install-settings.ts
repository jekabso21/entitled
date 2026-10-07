import { z } from 'zod'

export const installSettingsSchema = z.object({
  autoPublishReleases: z.boolean(),
})

export type InstallSettings = z.infer<typeof installSettingsSchema>

export const updateInstallSettingsInputSchema = installSettingsSchema.partial().strict()

export type UpdateInstallSettingsInput = z.infer<typeof updateInstallSettingsInputSchema>
