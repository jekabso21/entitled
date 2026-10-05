import { createRouter } from '#lib/create-router.ts'
import { createClientAccountRoute } from './create-client-account.route.ts'
import { getClientAccountRoute } from './get-client-account.route.ts'
import { listClientAccountsRoute } from './list-client-accounts.route.ts'

export const clientAccountsRouter = createRouter()
  .route('/', listClientAccountsRoute)
  .route('/', getClientAccountRoute)
  .route('/', createClientAccountRoute)
