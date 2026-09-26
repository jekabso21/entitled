type InvitationEmailInput = {
  portalName: string
  inviterName: string
  accountName: string | null
  link: string
  expiresAt: Date
}

export function buildInvitationEmail(input: InvitationEmailInput) {
  const target = input.accountName ? `the ${input.accountName} account on ` : ''
  const subject = `You're invited to ${input.portalName}`
  const text = [
    `${input.inviterName} invited you to ${target}${input.portalName}.`,
    '',
    `Accept the invitation: ${input.link}`,
    '',
    `The link expires on ${input.expiresAt.toUTCString()}.`,
  ].join('\n')
  return { subject, text }
}
