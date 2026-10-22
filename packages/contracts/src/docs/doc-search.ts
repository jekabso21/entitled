import { z } from 'zod'

export const docSearchQuerySchema = z.object({ q: z.string().trim().min(2).max(100) })

export const docSearchResultSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  // Plain text around the match; matched words are wrapped in ⟦ and ⟧ for highlighting.
  snippet: z.string(),
})

export type DocSearchResult = z.infer<typeof docSearchResultSchema>
