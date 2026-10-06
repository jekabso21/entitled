import { expect, test } from '@playwright/test'
import { clientAdminEmail, signIn, vendorAdminEmail } from './demo-users.ts'

test('a product granted to Acme shows up for the Acme client admin', async ({ page, browser }) => {
  const name = `Gateway ${String(Date.now())}`

  await signIn(page, vendorAdminEmail)
  await page.getByRole('link', { name: 'Products' }).click()
  await page.getByRole('button', { name: 'New product' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByRole('link', { name }).click()

  await page.getByRole('button', { name: 'Add revision' }).click()
  await page.getByLabel('Code').fill('A')
  await page.getByLabel('Name').fill('First batch')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('First batch')).toBeVisible()

  await page.getByRole('link', { name: 'Client accounts' }).click()
  await page.getByRole('link', { name: 'Acme Robotics' }).click()
  await page.getByRole('button', { name: 'Grant access' }).click()
  await page.getByRole('combobox', { name: 'Product' }).click()
  await page.getByRole('option', { name }).click()
  await page.getByRole('button', { name: 'Grant', exact: true }).click()
  const granted = page
    .getByRole('listitem')
    .filter({ hasText: name })
    .filter({ hasText: 'All revisions' })
  await expect(granted).toBeVisible()

  const client = await (await browser.newContext()).newPage()
  await signIn(client, clientAdminEmail)
  await client.getByRole('link', { name }).click()
  await expect(client.getByRole('heading', { name })).toBeVisible()
  await expect(client.getByText('Rev A · First batch')).toBeVisible()
})
