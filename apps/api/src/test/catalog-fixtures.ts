import type { Product } from '@entitled/contracts/products'
import { expect } from 'vitest'
import { createApp } from '#app.ts'
import { jsonRequest, uniqueSuffix } from './test-users.ts'

export async function createProductWithRevisions(cookie: string, codes: string[]) {
  const app = createApp()
  const suffix = uniqueSuffix()
  const created = await app.request(
    '/api/products',
    jsonRequest('POST', { name: `Controller ${suffix}`, slug: `controller-${suffix}` }, cookie),
  )
  expect(created.status).toBe(201)
  const product = (await created.json()) as Product
  for (const code of codes) {
    const res = await app.request(
      `/api/products/${product.id}/revisions`,
      jsonRequest('POST', { code, name: `Revision ${code}` }, cookie),
    )
    expect(res.status).toBe(201)
  }
  const full = await app.request(`/api/products/${product.id}`, { headers: { cookie } })
  return (await full.json()) as Product
}
