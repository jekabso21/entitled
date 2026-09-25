import { serve } from '@hono/node-server'
import { createApp } from '#app.ts'
import { env } from '#config/env.ts'

serve({ fetch: createApp().fetch, port: env.PORT }, (info) => {
  console.warn(`api listening on :${String(info.port)}`)
})
