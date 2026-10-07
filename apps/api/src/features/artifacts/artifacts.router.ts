import { createRouter } from '#lib/create-router.ts'
import { completeArtifactUploadRoute } from './complete-artifact-upload.route.ts'
import { createArtifactUploadRoute } from './create-artifact-upload.route.ts'
import { deleteArtifactRoute } from './delete-artifact.route.ts'
import { downloadArtifactRoute } from './download-artifact.route.ts'

export const artifactsRouter = createRouter()
  .route('/', createArtifactUploadRoute)
  .route('/', completeArtifactUploadRoute)
  .route('/', deleteArtifactRoute)
  .route('/', downloadArtifactRoute)
