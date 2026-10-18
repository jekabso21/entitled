import { createRouter } from '#lib/create-router.ts'
import { createDocAssetRoute } from './create-doc-asset.route.ts'
import { createDocPageRoute } from './create-doc-page.route.ts'
import { deleteDocPageRoute } from './delete-doc-page.route.ts'
import { exportDocPageRoute } from './export-doc-page.route.ts'
import { getDocAssetRoute } from './get-doc-asset.route.ts'
import { getDocPageRoute } from './get-doc-page.route.ts'
import { importDocPageRoute } from './import-doc-page.route.ts'
import { listDocPagesRoute } from './list-doc-pages.route.ts'
import { updateDocPageRoute } from './update-doc-page.route.ts'

export const docsRouter = createRouter()
  .route('/', listDocPagesRoute)
  .route('/', importDocPageRoute)
  .route('/', createDocPageRoute)
  .route('/', getDocPageRoute)
  .route('/', exportDocPageRoute)
  .route('/', updateDocPageRoute)
  .route('/', deleteDocPageRoute)
  .route('/', createDocAssetRoute)
  .route('/', getDocAssetRoute)
