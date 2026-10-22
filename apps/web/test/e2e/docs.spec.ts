import { expect, test } from '@playwright/test'
import { clientAdminState, open, vendorAdminState } from './demo-users.ts'

// A 1x1 transparent PNG.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test('an editor writes a page with a table and image, publishes it, and the client reads it', async ({
  browser,
}) => {
  const title = `Wiring guide ${String(Date.now())}`
  const vendor = await (await browser.newContext({ storageState: vendorAdminState })).newPage()
  await open(vendor, '/admin/docs')
  await vendor.getByRole('link', { name: /Motion Controller MC-200/ }).click()
  await vendor.getByRole('button', { name: 'New page' }).first().click()
  await expect(vendor).toHaveURL(/\/admin\/docs\/[^/]+\/[^/]+$/)

  await vendor.getByLabel('Title', { exact: true }).fill(title)
  const editor = vendor.locator('.ProseMirror')
  await editor.click()
  await vendor.keyboard.type('Connect the ')
  await vendor.keyboard.press('Control+b')
  await vendor.keyboard.type('green')
  await vendor.keyboard.press('Control+b')
  await vendor.keyboard.type(' wire first.')
  await vendor.keyboard.press('Enter')

  await vendor.getByRole('button', { name: 'Insert table' }).click()
  await expect(editor.locator('table')).toBeVisible()

  const chooser = vendor.waitForEvent('filechooser')
  await vendor.getByRole('button', { name: 'Insert image or video' }).click()
  await (await chooser).setFiles({ name: 'pinout.png', mimeType: 'image/png', buffer: png })
  await expect(editor.locator('img[src*="/api/doc-assets/"]')).toBeVisible()

  await vendor.getByRole('tab', { name: 'Markdown' }).click()
  const source = vendor.getByLabel('Markdown source')
  await expect(source).toHaveValue(/\*\*green\*\*/)
  await expect(source).toHaveValue(/\| --- \|/)
  await expect(source).toHaveValue(/!\[pinout\.png\]\(\/api\/doc-assets\//)

  await vendor.getByRole('button', { name: 'Publish' }).click()
  await expect(vendor.getByText('Page published', { exact: true })).toBeVisible()

  const client = await (await browser.newContext({ storageState: clientAdminState })).newPage()
  await open(client, '/')
  await client.getByRole('link', { name: 'Motion Controller MC-200' }).click()
  await client.getByRole('link', { name: title }).click()
  await expect(client.getByRole('heading', { name: title })).toBeVisible()
  await expect(client.locator('article strong', { hasText: 'green' })).toBeVisible()
  await expect(client.locator('article table')).toBeVisible()
  const image = client.locator('article img[src*="/api/doc-assets/"]')
  await expect(image).toBeVisible()
  expect(await image.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBe(1)
})
