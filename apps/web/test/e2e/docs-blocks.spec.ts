import { expect, test } from '@playwright/test'
import type { DocPage, DocPageSummary } from '@entitled/contracts/docs'
import type { Product } from '@entitled/contracts/products'
import { clientAdminState, open, vendorAdminState } from './demo-users.ts'

test('callouts, formulas and page links from the / menu reach the client with tabs, math and search', async ({
  browser,
}) => {
  const stamp = String(Date.now())
  const vendor = await (await browser.newContext({ storageState: vendorAdminState })).newPage()
  const products = (await (await vendor.request.get('/api/products')).json()) as Product[]
  const product = products.find((item) => item.name.includes('MC-200')) ?? products[0]
  const productId = product?.id ?? ''
  const pages = (await (
    await vendor.request.get(`/api/products/${productId}/docs`)
  ).json()) as DocPageSummary[]
  const target = pages.find((item) => item.status === 'published')
  const created = (await (
    await vendor.request.post(`/api/products/${productId}/docs`, {
      data: {
        title: `Blocks ${stamp}`,
        body: `Intro ${stamp}.\n\n## Flashing {.tabset}\n\n### Windows\n\nRun the installer.\n\n### Linux\n\nRun the script.\n\n## Next steps\n\nCheck the LED.`,
      },
    })
  ).json()) as DocPage

  await open(vendor, `/admin/docs/${productId}/${created.id}`)
  const editor = vendor.locator('.ProseMirror')
  // ProseMirror reads a clicked caret on the next selectionchange; the delay keeps the keys
  // from outrunning it, as no person could.
  await editor.getByText(`Intro ${stamp}.`).click({ delay: 50 })
  await vendor.keyboard.press('End', { delay: 50 })
  await vendor.keyboard.type(' Done.')
  await vendor.keyboard.press('Enter')
  await vendor.keyboard.type('/warn')
  await vendor.getByRole('option', { name: /Warning/ }).click()

  // The caret is still inside the callout, so the formula and link land in it.
  await vendor.keyboard.press('Enter')
  await vendor.keyboard.type('/formula')
  await vendor.getByRole('option', { name: /^Formula/ }).click()
  await vendor.getByLabel('LaTeX').fill('P = V \\cdot I')
  await vendor.getByRole('button', { name: 'Insert' }).click()
  await expect(editor.locator('[data-type="block-math"] .katex')).toBeVisible()

  await vendor.getByRole('button', { name: 'Link to a page' }).click()
  await vendor.getByPlaceholder('Find a page…').fill(target?.title ?? '')
  await vendor
    .getByRole('option', { name: target?.title ?? '' })
    .first()
    .click()

  await vendor.getByRole('tab', { name: 'Markdown' }).click()
  const markdown = vendor.getByLabel('Markdown source')
  await expect(markdown).toHaveValue(/> \[!WARNING\]/)
  await expect(markdown).toHaveValue(/\$\$\n(> )?P = V \\cdot I\n(> )?\$\$/)
  await expect(markdown).toHaveValue(
    new RegExp(`\\(/products/${productId}/docs/${target?.id ?? ''}\\)`),
  )
  await vendor.getByRole('button', { name: 'Publish' }).click()
  await expect(vendor.getByText('Page published').first()).toBeVisible()

  const client = await (await browser.newContext({ storageState: clientAdminState })).newPage()
  await open(client, `/products/${productId}/docs/${created.id}`)
  const article = client.locator('article')
  await expect(article.locator('.markdown-alert-warning')).toBeVisible()
  await expect(article.locator('.katex-display')).toBeVisible()
  await expect(client.getByRole('navigation', { name: 'On this page' })).toContainText('Flashing')

  await expect(client.getByRole('tabpanel')).toContainText('Run the installer.')
  await client.getByRole('tab', { name: 'Linux' }).click()
  await expect(client.getByRole('tabpanel')).toContainText('Run the script.')

  await client.getByRole('textbox', { name: 'Search the docs' }).fill(stamp)
  await expect(client.getByRole('link', { name: new RegExp(`Blocks ${stamp}`) })).toBeVisible()
})
