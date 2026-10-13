import { createRouter } from '#lib/create-router.ts'
import { deleteLogoRoute } from './delete-logo.route.ts'
import { getBrandingRoute } from './get-branding.route.ts'
import { getLogoRoute } from './get-logo.route.ts'
import { updateBrandingRoute } from './update-branding.route.ts'
import { uploadLogoRoute } from './upload-logo.route.ts'

export const brandingRouter = createRouter()
  .route('/', getBrandingRoute)
  .route('/', updateBrandingRoute)
  .route('/', getLogoRoute)
  .route('/', uploadLogoRoute)
  .route('/', deleteLogoRoute)
