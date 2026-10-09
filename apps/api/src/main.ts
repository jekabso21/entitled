import { serve } from '@hono/node-server'
import { createApp } from '#app.ts'
import { env } from '#config/env.ts'
import { renderMarkdownCached } from '#lib/markdown.ts'

serve({ fetch: createApp().fetch, port: env.PORT }, (info) => {
  console.warn(`api listening on :${String(info.port)}`)
})

// Loads Shiki grammars up front so the first changelog render is not slow.
void renderMarkdownCached('```ts\nconst ready = true\n```')
