import { createRouter } from '#lib/create-router.ts'
import { grantEntitlementRoute } from './grant-entitlement.route.ts'
import { listEntitlementsRoute } from './list-entitlements.route.ts'
import { revokeEntitlementRoute } from './revoke-entitlement.route.ts'

export const entitlementsRouter = createRouter()
  .route('/', listEntitlementsRoute)
  .route('/', grantEntitlementRoute)
  .route('/', revokeEntitlementRoute)
