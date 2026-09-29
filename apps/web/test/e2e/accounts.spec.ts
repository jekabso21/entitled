import { expect, test } from '@playwright/test'
import { clientAdminEmail, signIn, vendorAdminEmail } from './demo-users.ts'
import { findInvitationPath } from './mailpit.ts'

test('vendor admin signs in to the dashboard and creates a client account', async ({ page }) => {
  await signIn(page, vendorAdminEmail)
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByText('Welcome back, Vendor Admin')).toBeVisible()

  await page.getByRole('link', { name: 'Client accounts' }).click()
  const name = `Globex ${String(Date.now())}`
  await page.getByRole('button', { name: 'New client account' }).click()
  await page.getByLabel('Company name').fill(name)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('cell', { name })).toBeVisible()
})

test('client admin sees their products page and cannot open the vendor area', async ({ page }) => {
  await signIn(page, clientAdminEmail)
  await expect(page.getByRole('heading', { name: 'Your products' })).toBeVisible()
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/$/)
})

test('an invited client user accepts the emailed link and lands in the portal', async ({
  page,
  browser,
}) => {
  const email = `invitee-${String(Date.now())}@example.test`
  await signIn(page, vendorAdminEmail)
  await page.getByRole('link', { name: 'Client accounts' }).click()
  await page
    .getByRole('row', { name: /Acme Robotics/ })
    .getByRole('button', { name: 'Invite user' })
    .click()
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Send invitation' }).click()
  await expect(page.getByText(`Invitation sent to ${email}`, { exact: true })).toBeVisible()

  const invitee = await (await browser.newContext()).newPage()
  await invitee.goto(await findInvitationPath(email))
  await expect(invitee.getByRole('button', { name: 'Create account' })).toBeEnabled()
  await invitee.getByLabel('Your name').fill('Invited Person')
  await invitee.getByLabel('Password', { exact: true }).fill('a-long-enough-password')
  await invitee.getByLabel('Confirm password').fill('a-long-enough-password')
  await invitee.getByRole('button', { name: 'Create account' }).click()
  await expect(invitee.getByRole('heading', { name: 'Your products' })).toBeVisible()
})
