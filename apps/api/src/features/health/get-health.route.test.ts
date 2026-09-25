import { describe, expect, it } from 'vitest'
import { createApp } from '#app.ts'

describe('GET /api/health', () => {
  it('reports ok when the database is reachable', async () => {
    const res = await createApp().request('/api/health')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok', database: true })
  })

  it('returns the shared error shape for unknown routes', async () => {
    const res = await createApp().request('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'not_found', message: 'Route not found' } })
  })
})
