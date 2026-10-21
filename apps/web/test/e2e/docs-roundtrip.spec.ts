import { expect, test } from '@playwright/test'
import type { DocPage } from '@entitled/contracts/docs'
import type { Product } from '@entitled/contracts/products'
import { open, vendorAdminState } from './demo-users.ts'

test.use({ storageState: vendorAdminState })

const source = `Intro paragraph.

> [!WARNING]
> Disconnect power first.

- [x] Unpack
- [ ] Flash firmware

\`\`\`mermaid
graph LR
  A --> B
\`\`\`
`

test('opening and editing a page in the visual editor keeps callouts, tasks and diagrams', async ({
  page,
}) => {
  const [product] = (await (await page.request.get('/api/products')).json()) as Product[]
  const created = (await (
    await page.request.post(`/api/products/${product?.id ?? ''}/docs`, {
      data: { title: `Round trip ${String(Date.now())}`, body: source },
    })
  ).json()) as DocPage

  await open(page, `/admin/docs/${created.id}`)
  await expect(page.locator('.ProseMirror')).toContainText('Intro paragraph.')
  await expect(page.getByText('Unsaved', { exact: true })).toHaveCount(0)

  await page.locator('.ProseMirror p', { hasText: 'Intro paragraph.' }).click()
  await page.keyboard.press('End')
  await page.keyboard.type(' Edited.')

  await page.getByRole('tab', { name: 'Markdown' }).click()
  const markdown = page.getByLabel('Markdown source')
  await expect(markdown).toHaveValue(/Intro paragraph\. Edited\./)
  await expect(markdown).toHaveValue(/> \[!WARNING\]/)
  await expect(markdown).toHaveValue(/- \[x\] Unpack/)
  await expect(markdown).toHaveValue(/- \[ \] Flash firmware/)
  await expect(markdown).toHaveValue(/```mermaid\ngraph LR/)
})
