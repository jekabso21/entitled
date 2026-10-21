import { createRouter } from '#lib/create-router.ts'
import { createClientAccountRoute } from './create-client-account.route.ts'
import { getClientAccountRoute } from './get-client-account.route.ts'
import { listClientAccountsRoute } from './list-client-accounts.route.ts'
import { removeMemberRoute } from './remove-member.route.ts'
import { updateMemberRoute } from './update-member.route.ts'

export const clientAccountsRouter = createRouter()
  .route('/', listClientAccountsRoute)
  .route('/', getClientAccountRoute)
  .route('/', createClientAccountRoute)
  .route('/', updateMemberRoute)
  .route('/', removeMemberRoute)
