import { createRouter } from '#lib/create-router.ts'
import { getMe } from './get-me.route.ts'

export const meRouter = createRouter().route('/', getMe)
