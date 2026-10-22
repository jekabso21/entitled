import { expect, test } from '@playwright/test'
import { clientAdminState, open, vendorAdminState } from './demo-users.ts'

// A 1x1 transparent PNG.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test('a Markdown document with an image becomes a published section of nested pages', async ({
  browser,
}) => {
  const stamp = String(Date.now())
  const title = `Field guide ${stamp}`
  const markdown = `# ${title}\n\nStart here.\n\n## Mounting\n\n![Bracket](img/bracket.png)\n\nUse two screws.\n\n### Torque ${stamp}\n\nTighten to 2 Nm.\n\n## Cleaning\n\nWipe with a dry cloth. See [the spec](missing/spec.pdf).\n`

  const vendor = await (await browser.newContext({ storageState: vendorAdminState })).newPage()
  await open(vendor, '/admin/docs')
  await vendor.getByRole('link', { name: /Motion Controller MC-200/ }).click()
  await vendor.getByRole('complementary').getByRole('button', { name: 'Import' }).click()
  const dialog = vendor.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles([
    { name: 'guide.md', mimeType: 'text/markdown', buffer: Buffer.from(markdown) },
    { name: 'bracket.png', mimeType: 'image/png', buffer: png },
  ])
  await expect(dialog.getByText('4 pages will be created')).toBeVisible()
  await expect(dialog.getByText('1 referenced files were not found')).toBeVisible()
  await dialog.getByText('Publish right away').click()
  await dialog.getByRole('button', { name: 'Import 4 pages' }).click()
  await expect(vendor).toHaveURL(/\/admin\/docs\/[^/]+\/[^/]+$/)

  const tree = vendor
    .getByRole('complementary')
    .getByRole('navigation', { name: 'Documentation pages' })
  await expect(tree.getByRole('link', { name: `Torque ${stamp}` })).toBeVisible()

  const client = await (await browser.newContext({ storageState: clientAdminState })).newPage()
  await open(client, '/')
  await client.getByRole('link', { name: 'Motion Controller MC-200' }).click()
  await client.getByRole('link', { name: title }).click()
  await expect(client.getByRole('heading', { name: title })).toBeVisible()
  await client.getByRole('link', { name: /^Next/ }).click()
  await expect(client.getByRole('heading', { name: 'Mounting' })).toBeVisible()
  const image = client.locator('article img[src*="/api/doc-assets/"]')
  await expect(image).toBeVisible()
  expect(await image.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBe(1)
  await expect(
    client
      .getByRole('navigation', { name: 'Documentation pages' })
      .getByRole('link', { name: `Torque ${stamp}` }),
  ).toBeVisible()
})
