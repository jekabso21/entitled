import { expect, test } from '@playwright/test'
import { open, vendorAdminState } from './demo-users.ts'

test.use({ storageState: vendorAdminState })

test('vendor admin sees recorded actions and can filter to downloads', async ({ page }) => {
  await page.request.post('/api/client-accounts', {
    data: { name: 'Audit Trail Co', slug: `audit-trail-${String(Date.now())}` },
  })

  await open(page, '/admin/audit-log')
  await expect(page.getByRole('cell', { name: 'client_account.created' }).first()).toBeVisible()

  await page.getByRole('combobox', { name: 'Filter' }).click()
  await page.getByRole('option', { name: 'Downloads' }).click()
  await expect(page.getByRole('cell', { name: 'client_account.created' })).toHaveCount(0)
})
