import { createRouter } from '#lib/create-router.ts'
import { createSupportAttachmentRoute } from './create-support-attachment.route.ts'
import { createSupportThreadRoute } from './create-support-thread.route.ts'
import { downloadSupportAttachmentRoute } from './download-support-attachment.route.ts'
import { getSupportThreadRoute } from './get-support-thread.route.ts'
import { listSupportThreadsRoute } from './list-support-threads.route.ts'
import { postSupportMessageRoute } from './post-support-message.route.ts'
import { updateSupportThreadRoute } from './update-support-thread.route.ts'

export const supportRouter = createRouter()
  .route('/', listSupportThreadsRoute)
  .route('/', createSupportThreadRoute)
  .route('/', getSupportThreadRoute)
  .route('/', postSupportMessageRoute)
  .route('/', updateSupportThreadRoute)
  .route('/', createSupportAttachmentRoute)
  .route('/', downloadSupportAttachmentRoute)
