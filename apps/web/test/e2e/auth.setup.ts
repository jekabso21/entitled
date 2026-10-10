import { expect, test as setup } from '@playwright/test'
import {
  clientAdminEmail,
  clientAdminState,
  signIn,
  vendorAdminEmail,
  vendorAdminState,
} from './demo-users.ts'

setup('vendor admin signs in through the form', async ({ page }) => {
  await signIn(page, vendorAdminEmail)
  await expect(page).toHaveURL(/\/admin$/)
  await page.context().storageState({ path: vendorAdminState })
})

setup('client admin signs in through the form', async ({ page }) => {
  await signIn(page, clientAdminEmail)
  await expect(page.getByRole('heading', { name: 'Your products' })).toBeVisible()
  await page.context().storageState({ path: clientAdminState })
})
