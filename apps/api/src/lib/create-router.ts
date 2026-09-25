import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppEnv } from '#lib/app-env.ts'
import { validationHook } from '#lib/validation-hook.ts'

export function createRouter() {
  return new OpenAPIHono<AppEnv>({ defaultHook: validationHook })
}
