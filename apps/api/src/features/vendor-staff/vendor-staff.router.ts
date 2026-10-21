import { createRouter } from '#lib/create-router.ts'
import { listVendorStaffRoute } from './list-vendor-staff.route.ts'
import { updateVendorStaffRoute } from './update-vendor-staff.route.ts'

export const vendorStaffRouter = createRouter()
  .route('/', listVendorStaffRoute)
  .route('/', updateVendorStaffRoute)
