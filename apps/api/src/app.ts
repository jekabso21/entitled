import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { env } from '#config/env.ts'
import { clientAccountsRouter } from '#features/client-accounts/client-accounts.router.ts'
import { healthRouter } from '#features/health/health.router.ts'
import { invitationsRouter } from '#features/invitations/invitations.router.ts'
import { meRouter } from '#features/me/me.router.ts'
import { auth } from '#lib/auth.ts'
import { createRouter } from '#lib/create-router.ts'
import { handleError, handleNotFound } from '#lib/error-handler.ts'
import { session } from '#middleware/session.ts'

export function createApp() {
  const app = createRouter()

  app.use(requestId())
  app.use(secureHeaders())
  app.use(cors({ origin: env.WEB_URL, credentials: true }))
  app.use(bodyLimit({ maxSize: 1024 * 1024 }))

  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  app.use('/api/*', session)

  app.route('/api', healthRouter)
  app.route('/api', meRouter)
  app.route('/api', clientAccountsRouter)
  app.route('/api', invitationsRouter)

  app.doc31('/api/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Entitled API', version: '0.0.0' },
  })

  app.onError(handleError)
  app.notFound(handleNotFound)

  return app
}
