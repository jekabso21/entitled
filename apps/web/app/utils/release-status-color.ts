import type { ReleaseStatus } from '@entitled/contracts/releases'

export function releaseStatusColor(status: ReleaseStatus) {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'info'
  return 'neutral'
}
