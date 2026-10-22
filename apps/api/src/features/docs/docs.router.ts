import { createRouter } from '#lib/create-router.ts'
import { createDocAssetRoute } from './create-doc-asset.route.ts'
import { createDocPageRoute } from './create-doc-page.route.ts'
import { deleteDocAssetsRoute } from './delete-doc-assets.route.ts'
import { deleteDocPageRoute } from './delete-doc-page.route.ts'
import { exportDocPageRoute } from './export-doc-page.route.ts'
import { getDocAssetRoute } from './get-doc-asset.route.ts'
import { getDocPageRoute } from './get-doc-page.route.ts'
import { getDocRevisionRoute } from './get-doc-revision.route.ts'
import { importDocPageRoute } from './import-doc-page.route.ts'
import { importDocPagesRoute } from './import-doc-pages.route.ts'
import { listDocAssetsRoute } from './list-doc-assets.route.ts'
import { listDocPagesRoute } from './list-doc-pages.route.ts'
import { listDocRevisionsRoute } from './list-doc-revisions.route.ts'
import { reorderDocPagesRoute } from './reorder-doc-pages.route.ts'
import { restoreDocRevisionRoute } from './restore-doc-revision.route.ts'
import { searchDocPagesRoute } from './search-doc-pages.route.ts'
import { updateDocPageRoute } from './update-doc-page.route.ts'

export const docsRouter = createRouter()
  .route('/', listDocPagesRoute)
  .route('/', searchDocPagesRoute)
  .route('/', importDocPageRoute)
  .route('/', importDocPagesRoute)
  .route('/', reorderDocPagesRoute)
  .route('/', createDocPageRoute)
  .route('/', getDocPageRoute)
  .route('/', exportDocPageRoute)
  .route('/', updateDocPageRoute)
  .route('/', deleteDocPageRoute)
  .route('/', createDocAssetRoute)
  .route('/', getDocAssetRoute)
  .route('/', listDocAssetsRoute)
  .route('/', deleteDocAssetsRoute)
  .route('/', listDocRevisionsRoute)
  .route('/', getDocRevisionRoute)
  .route('/', restoreDocRevisionRoute)
