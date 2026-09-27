import type { CurrentUser } from '@entitled/contracts/accounts'

export function homePath(user: CurrentUser) {
  return user.vendorRole ? '/admin' : '/'
}
