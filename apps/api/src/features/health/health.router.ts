import { createRouter } from '#lib/create-router.ts'
import { getHealth } from './get-health.route.ts'

export const healthRouter = createRouter().route('/', getHealth)
