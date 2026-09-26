import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(12, { error: 'Use at least 12 characters' })
  .max(128, { error: 'Use at most 128 characters' })
