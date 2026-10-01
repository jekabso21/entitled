import { createRouter } from '#lib/create-router.ts'
import { createProductRoute } from './create-product.route.ts'
import { createRevisionRoute } from './create-revision.route.ts'
import { getProductRoute } from './get-product.route.ts'
import { listProductsRoute } from './list-products.route.ts'

export const productsRouter = createRouter()
  .route('/', listProductsRoute)
  .route('/', getProductRoute)
  .route('/', createProductRoute)
  .route('/', createRevisionRoute)
