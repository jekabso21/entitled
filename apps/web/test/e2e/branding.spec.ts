import { expect, test } from '@playwright/test'
import { open, vendorAdminState } from './demo-users.ts'

test.use({ storageState: vendorAdminState })

test('renaming the portal shows the new name on the sign-in page', async ({ page, browser }) => {
  const name = `Acme Portal ${String(Date.now()).slice(-4)}`
  await open(page, '/admin/settings')
  await page.getByLabel('Portal name').fill(name)
  await page.getByRole('button', { name: 'Save branding' }).click()
  await expect(page.getByText('Branding saved', { exact: true })).toBeVisible()

  const visitor = await (await browser.newContext()).newPage()
  await visitor.goto('/login')
  await expect(visitor.getByText(name)).toBeVisible()
  await expect(visitor).toHaveTitle(`Sign in · ${name}`)

  // Restore the demo name so other suites and screenshots stay predictable.
  await page.request.patch('/api/branding', {
    data: { portalName: 'Entitled', primaryColor: 'indigo' },
  })
})
