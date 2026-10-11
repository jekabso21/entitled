import { createRouter } from '#lib/create-router.ts'
import { createApiKeyRoute } from './create-api-key.route.ts'
import { listApiKeysRoute } from './list-api-keys.route.ts'
import { revokeApiKeyRoute } from './revoke-api-key.route.ts'

export const apiKeysRouter = createRouter()
  .route('/', listApiKeysRoute)
  .route('/', createApiKeyRoute)
  .route('/', revokeApiKeyRoute)
