import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const domainErrorStatus = {
  not_found: 404,
  forbidden: 403,
  conflict: 409,
  invalid_state: 422,
} as const satisfies Record<string, ContentfulStatusCode>

export type DomainErrorCode = keyof typeof domainErrorStatus

export class DomainError extends Error {
  readonly code: DomainErrorCode

  constructor(code: DomainErrorCode, message: string) {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}
