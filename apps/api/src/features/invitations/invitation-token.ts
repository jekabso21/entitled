const TOKEN_BYTES = 32

export async function hashInvitationToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Buffer.from(digest).toString('hex')
}

export async function generateInvitationToken() {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))).toString(
    'base64url',
  )
  return { token, tokenHash: await hashInvitationToken(token) }
}
