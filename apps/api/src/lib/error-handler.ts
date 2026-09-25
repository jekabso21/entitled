import type { ApiError } from '@entitled/contracts/errors'
import type { ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { DomainError, domainErrorStatus } from '#lib/domain-error.ts'

export const handleError: ErrorHandler = (err, c) => {
  if (err instanceof DomainError) {
    return c.json<ApiError>(
      { error: { code: err.code, message: err.message } },
      domainErrorStatus[err.code],
    )
  }
  if (err instanceof HTTPException) {
    return c.json<ApiError>({ error: { code: 'http_error', message: err.message } }, err.status)
  }
  console.error({ requestId: c.get('requestId'), err })
  return c.json<ApiError>({ error: { code: 'internal', message: 'Internal server error' } }, 500)
}

export const handleNotFound: NotFoundHandler = (c) =>
  c.json<ApiError>({ error: { code: 'not_found', message: 'Route not found' } }, 404)
