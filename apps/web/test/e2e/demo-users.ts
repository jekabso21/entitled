import { expect, type Page } from '@playwright/test'

export const demoPassword = process.env.DEMO_PASSWORD ?? 'entitled-demo-pass'
export const vendorAdminEmail = 'admin@entitled.local'
export const clientAdminEmail = 'client@acme.local'

export const vendorAdminState = 'test/e2e/.auth/vendor-admin.json'
export const clientAdminState = 'test/e2e/.auth/client-admin.json'

export async function signIn(page: Page, email: string, password = demoPassword) {
  await page.goto('/login')
  const submit = page.getByRole('button', { name: 'Sign in' })
  // The button enables once Vue has hydrated; typing earlier would be wiped by hydration.
  await expect(submit).toBeEnabled()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await submit.click()
}

// Full page loads are interactive only after hydration; network idle is a reliable proxy.
export async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' })
}
