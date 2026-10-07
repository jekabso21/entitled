import { createRouter } from '#lib/create-router.ts'
import { archiveReleaseRoute } from './archive-release.route.ts'
import { createReleaseRoute } from './create-release.route.ts'
import { getReleaseRoute } from './get-release.route.ts'
import { listReleasesRoute } from './list-releases.route.ts'
import { publishReleaseRoute } from './publish-release.route.ts'
import { updateReleaseRoute } from './update-release.route.ts'

export const releasesRouter = createRouter()
  .route('/', listReleasesRoute)
  .route('/', getReleaseRoute)
  .route('/', createReleaseRoute)
  .route('/', updateReleaseRoute)
  .route('/', publishReleaseRoute)
  .route('/', archiveReleaseRoute)
