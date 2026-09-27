import { apiErrorSchema } from '@entitled/contracts/errors'

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  const data = (error as { data?: unknown } | null)?.data
  const parsed = apiErrorSchema.safeParse(data)
  return parsed.success ? parsed.data.error.message : fallback
}
