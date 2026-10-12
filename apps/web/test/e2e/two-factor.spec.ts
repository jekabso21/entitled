import { expect, test } from '@playwright/test'
import { open, signIn, vendorAdminState } from './demo-users.ts'
import { findInvitationPath } from './mailpit.ts'
import { totp } from './totp.ts'

test.use({ storageState: vendorAdminState })

test('a user turns on two-factor and must enter a code at the next sign-in', async ({
  page,
  browser,
}) => {
  const email = `staff-${String(Date.now())}@example.test`
  const password = 'a-long-enough-password'

  const invited = await page.request.post('/api/invitations', {
    data: { kind: 'vendor', email, vendorRole: 'editor' },
  })
  expect(invited.status()).toBe(201)
  const token = (await findInvitationPath(email)).split('/').pop() ?? ''

  const context = await browser.newContext()
  const accepted = await context.request.post(`/api/invitations/${token}/accept`, {
    data: { name: 'Two Factor', password },
  })
  expect(accepted.status()).toBe(200)

  const staff = await context.newPage()
  await open(staff, '/admin/security')
  await staff.getByLabel('Confirm with your password').fill(password)
  const enabled = staff.waitForResponse((res) => res.url().endsWith('/two-factor/enable'))
  await staff.getByRole('button', { name: 'Set up' }).click()
  const { totpURI } = (await (await enabled).json()) as { totpURI: string }

  await staff.getByRole('textbox').first().click()
  await staff.keyboard.type(totp(totpURI))
  await staff.getByRole('button', { name: 'Turn on' }).click()
  await expect(staff.getByText('Two-factor authentication is on', { exact: true })).toBeVisible()

  await staff.getByRole('button', { name: 'Two Factor' }).click()
  await staff.getByRole('menuitem', { name: 'Sign out' }).click()
  await signIn(staff, email, password)
  await expect(staff.getByRole('heading', { name: 'Two-factor verification' })).toBeVisible()

  await staff.getByRole('textbox').first().click()
  // The next window's code is accepted and avoids reusing the one just spent.
  await staff.keyboard.type(totp(totpURI, 30))
  await staff.getByRole('button', { name: 'Verify' }).click()
  await expect(staff).toHaveURL(/\/admin$/)
})
