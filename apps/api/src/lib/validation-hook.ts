import type { ApiError } from '@entitled/contracts/errors'
import type { Hook } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppEnv } from '#lib/app-env.ts'

export const validationHook: Hook<unknown, AppEnv, string, unknown> = (result, c) => {
  if (result.success) return
  return c.json<ApiError>(
    {
      error: {
        code: 'validation_failed',
        message: 'Request validation failed',
        details: z.treeifyError(result.error),
      },
    },
    422,
  )
}
