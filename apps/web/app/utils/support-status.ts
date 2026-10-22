import type { SupportThreadStatus } from '@entitled/contracts/support'

export const supportStatusLabel: Record<SupportThreadStatus, string> = {
  open: 'Open',
  waiting_on_client: 'Waiting on client',
  resolved: 'Resolved',
}

export const supportStatusColor = {
  open: 'info',
  waiting_on_client: 'warning',
  resolved: 'success',
} as const satisfies Record<SupportThreadStatus, string>
