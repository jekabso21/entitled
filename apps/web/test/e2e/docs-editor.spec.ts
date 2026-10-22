import { expect, test } from '@playwright/test'
import type { DocPage } from '@entitled/contracts/docs'
import type { Product } from '@entitled/contracts/products'
import { open, vendorAdminState } from './demo-users.ts'

test.use({ storageState: vendorAdminState })

test('the slash menu and selection toolbar write Markdown, and full screen centres the page', async ({
  page,
}) => {
  const [product] = (await (await page.request.get('/api/products')).json()) as Product[]
  const created = (await (
    await page.request.post(`/api/products/${product?.id ?? ''}/docs`, {
      data: { title: `Slash menu ${String(Date.now())}`, body: 'Mount the controller.' },
    })
  ).json()) as DocPage

  await open(page, `/admin/docs/${product?.id ?? ''}/${created.id}`)
  const editor = page.locator('.ProseMirror')
  await expect(editor).toContainText('Mount the controller.')
  // ProseMirror reads a clicked caret on the next selectionchange; the delay keeps the keys
  // from outrunning it, as no person could.
  await editor.getByText('Mount the controller.').click({ delay: 50 })
  await page.keyboard.press('End', { delay: 50 })
  await page.keyboard.type(' Then wire it.')
  await page.keyboard.press('Enter')
  await page.keyboard.type('/head')
  await page.getByRole('option', { name: 'Heading 2' }).click()
  await page.keyboard.type('Wiring')
  await expect(editor.getByRole('heading', { name: 'Wiring' })).toBeVisible()

  await page.keyboard.press('Shift+Home')
  // Strikethrough exists only in the selection toolbar, so this also proves it appeared.
  await page.getByRole('button', { name: 'Strikethrough' }).click()

  await page.getByRole('button', { name: 'Full screen' }).click()
  const title = await page.getByRole('textbox', { name: 'Title', exact: true }).boundingBox()
  const width = page.viewportSize()?.width ?? 0
  expect(Math.abs((title?.x ?? 0) + (title?.width ?? 0) / 2 - width / 2)).toBeLessThan(40)
  await page.getByRole('button', { name: 'Exit full screen' }).click()

  await page.getByRole('tab', { name: 'Markdown' }).click()
  const markdown = page.getByLabel('Markdown source')
  await expect(markdown).toHaveValue(/^Mount the controller\. Then wire it\.\n+## ~~Wiring~~/)
})
