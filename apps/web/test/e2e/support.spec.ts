import { expect, test } from '@playwright/test'
import { clientAdminState, open, vendorAdminState } from './demo-users.ts'

test('a client request gets an internal note and a public reply; the client sees only the reply', async ({
  browser,
}) => {
  const subject = `Controller resets ${String(Date.now())}`

  const client = await (await browser.newContext({ storageState: clientAdminState })).newPage()
  await open(client, '/')
  await client.getByRole('link', { name: 'Motion Controller MC-200' }).click()
  await client.getByRole('link', { name: 'Get support' }).click()
  await client.getByLabel('Subject').fill(subject)
  await client.getByPlaceholder('').first().fill('It resets every few minutes under load.')
  await client.locator('input[type=file]').setInputFiles({
    name: 'serial.log',
    mimeType: 'text/plain',
    buffer: Buffer.from('watchdog reset'),
  })
  await expect(client.getByText('serial.log')).toBeVisible()
  await client.getByRole('button', { name: 'Send request' }).click()
  await expect(client.getByRole('heading', { name: subject })).toBeVisible()

  const vendor = await (await browser.newContext({ storageState: vendorAdminState })).newPage()
  await open(vendor, '/admin/support')
  await vendor.getByRole('link', { name: subject }).click()
  await expect(vendor.getByRole('link', { name: /serial\.log/ })).toBeVisible()

  await vendor.getByPlaceholder('Write a reply…').fill('Customer on old bootloader, see RMA-17')
  await vendor.getByRole('switch', { name: 'Internal note' }).click()
  await vendor.getByRole('button', { name: 'Add note' }).click()
  await expect(vendor.getByText('Customer on old bootloader, see RMA-17')).toBeVisible()

  await vendor.getByPlaceholder('Write a reply…').fill('Please update the bootloader to 1.4 first.')
  await vendor.getByRole('button', { name: 'Send reply' }).click()
  await expect(vendor.getByText('Please update the bootloader to 1.4 first.')).toBeVisible()

  await client.reload({ waitUntil: 'networkidle' })
  await expect(client.getByText('Please update the bootloader to 1.4 first.')).toBeVisible()
  await expect(client.getByText('RMA-17')).toHaveCount(0)
  await expect(client.getByText('Waiting on client')).toBeVisible()
})
