import { createRouter } from '#lib/create-router.ts'
import { getSettingsRoute } from './get-settings.route.ts'
import { updateSettingsRoute } from './update-settings.route.ts'

export const settingsRouter = createRouter()
  .route('/', getSettingsRoute)
  .route('/', updateSettingsRoute)
