import { createRouter } from '#lib/create-router.ts'
import { acceptInvitationRoute } from './accept-invitation.route.ts'
import { createInvitationRoute } from './create-invitation.route.ts'
import { getInvitationRoute } from './get-invitation.route.ts'
import { listInvitationsRoute } from './list-invitations.route.ts'
import { revokeInvitationRoute } from './revoke-invitation.route.ts'

export const invitationsRouter = createRouter()
  .route('/', listInvitationsRoute)
  .route('/', createInvitationRoute)
  .route('/', getInvitationRoute)
  .route('/', acceptInvitationRoute)
  .route('/', revokeInvitationRoute)
