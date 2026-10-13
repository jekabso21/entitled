import { z } from 'zod'

// Tailwind palettes Nuxt UI can theme with; each ships every shade from 50 to 950.
export const brandColors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const

export const brandColorSchema = z.enum(brandColors)

export const logoContentTypes = ['image/png', 'image/jpeg', 'image/webp'] as const

export const MAX_LOGO_BYTES = 512 * 1024

export const brandingSchema = z.object({
  portalName: z.string(),
  primaryColor: brandColorSchema,
  // Changes whenever the logo changes, so browsers refetch it; null when there is none.
  logoUrl: z.string().nullable(),
})

export type Branding = z.infer<typeof brandingSchema>

export const updateBrandingInputSchema = z
  .strictObject({
    portalName: z.string().trim().min(1).max(80),
    primaryColor: brandColorSchema,
  })
  .partial()

export type UpdateBrandingInput = z.infer<typeof updateBrandingInputSchema>
