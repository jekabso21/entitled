import { expect, test } from '@playwright/test'
import { clientAdminEmail, signIn, vendorAdminEmail } from './demo-users.ts'

test('a published release with a file reaches the entitled client', async ({ page, browser }) => {
  const product = `Sensor ${String(Date.now())}`

  await signIn(page, vendorAdminEmail)
  await page.getByRole('link', { name: 'Products' }).click()
  await page.getByRole('button', { name: 'New product' }).click()
  await page.getByLabel('Name').fill(product)
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByRole('link', { name: product }).click()

  await page.getByRole('button', { name: 'New release' }).click()
  await page.getByLabel('Version').fill('3.1.0')
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page).toHaveURL(/\/admin\/releases\//)

  await page
    .getByPlaceholder('- Added …')
    .fill('## Highlights\n\n- Faster boot\n\n```c\nint main(void) { return 0; }\n```')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Release saved', { exact: true })).toBeVisible()

  await page.locator('input[type=file]').setInputFiles({
    name: 'sensor-3.1.0.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('firmware-bytes'),
  })
  await expect(page.getByRole('cell', { name: 'ready' })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByText('Release published', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Client accounts' }).click()
  await page.getByRole('link', { name: 'Acme Robotics' }).click()
  await page.getByRole('button', { name: 'Grant access' }).click()
  await page.getByRole('combobox', { name: 'Product' }).click()
  await page.getByRole('option', { name: product }).click()
  await page.getByRole('button', { name: 'Grant', exact: true }).click()

  const client = await (await browser.newContext()).newPage()
  await signIn(client, clientAdminEmail)
  await client.getByRole('link', { name: product }).click()
  await expect(client.getByRole('heading', { name: 'Highlights' })).toBeVisible()
  await expect(client.locator('pre.shiki')).toBeVisible()

  const downloadLink = client.getByRole('link', { name: 'Download' })
  const response = await client.request.get((await downloadLink.getAttribute('href')) ?? '')
  expect(await response.text()).toBe('firmware-bytes')
})
