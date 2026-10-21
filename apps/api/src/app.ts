import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { env } from '#config/env.ts'
import { apiKeysRouter } from '#features/api-keys/api-keys.router.ts'
import { listAuditEntriesRoute } from '#features/audit/list-audit-entries.route.ts'
import { artifactsRouter } from '#features/artifacts/artifacts.router.ts'
import { brandingRouter } from '#features/branding/branding.router.ts'
import { clientAccountsRouter } from '#features/client-accounts/client-accounts.router.ts'
import { docsRouter } from '#features/docs/docs.router.ts'
import { entitlementsRouter } from '#features/entitlements/entitlements.router.ts'
import { healthRouter } from '#features/health/health.router.ts'
import { invitationsRouter } from '#features/invitations/invitations.router.ts'
import { previewMarkdownRoute } from '#features/markdown/preview-markdown.route.ts'
import { meRouter } from '#features/me/me.router.ts'
import { productsRouter } from '#features/products/products.router.ts'
import { releasesRouter } from '#features/releases/releases.router.ts'
import { settingsRouter } from '#features/settings/settings.router.ts'
import { supportRouter } from '#features/support/support.router.ts'
import { vendorStaffRouter } from '#features/vendor-staff/vendor-staff.router.ts'
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
  app.route('/api', productsRouter)
  app.route('/api', entitlementsRouter)
  app.route('/api', releasesRouter)
  app.route('/api', artifactsRouter)
  app.route('/api', settingsRouter)
  app.route('/api', previewMarkdownRoute)
  app.route('/api', apiKeysRouter)
  app.route('/api', listAuditEntriesRoute)
  app.route('/api', brandingRouter)
  app.route('/api', supportRouter)
  app.route('/api', docsRouter)
  app.route('/api', vendorStaffRouter)

  app.openAPIRegistry.registerComponent('securitySchemes', 'apiKey', {
    type: 'http',
    scheme: 'bearer',
    description: 'CI API key (ent_…), accepted by the release and artifact endpoints',
  })
  app.doc31('/api/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Entitled API', version: '0.0.0' },
  })

  app.onError(handleError)
  app.notFound(handleNotFound)

  return app
}
