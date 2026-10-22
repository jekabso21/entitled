import { expect, test } from '@playwright/test'
import { clientAdminState, open, vendorAdminState } from './demo-users.ts'

test('a client admin invites a colleague from the team page and can revoke it', async ({
  browser,
}) => {
  const email = `colleague-${String(Date.now())}@example.test`
  const page = await (await browser.newContext({ storageState: clientAdminState })).newPage()
  await open(page, '/account/team')
  await page.getByRole('button', { name: 'Invite', exact: true }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Send invitation' }).click()

  const pending = page
    .getByRole('listitem')
    .filter({ hasText: email })
    .filter({ hasText: 'Invited' })
  await expect(pending).toBeVisible()
  await page.getByRole('button', { name: `Revoke invitation for ${email}` }).click()
  await expect(pending).toHaveCount(0)
})

test('a vendor admin sees the vendor team with roles', async ({ browser }) => {
  const page = await (await browser.newContext({ storageState: vendorAdminState })).newPage()
  await open(page, '/admin/team')
  await expect(page.getByRole('cell', { name: 'admin@entitled.local' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Role of Vendor Admin' })).toBeDisabled()
})
