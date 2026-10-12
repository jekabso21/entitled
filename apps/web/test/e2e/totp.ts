import { createHmac } from 'node:crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string) {
  let bits = ''
  for (const char of input.replace(/=+$/, '').toUpperCase()) {
    bits += BASE32.indexOf(char).toString(2).padStart(5, '0')
  }
  const bytes = bits.match(/.{8}/g) ?? []
  return Buffer.from(bytes.map((byte) => parseInt(byte, 2)))
}

// RFC 6238 TOTP (SHA-1, 6 digits, 30 s), enough to drive the sign-in flow in tests.
export function totp(otpauthUri: string, offsetSeconds = 0) {
  const secret = new URL(otpauthUri).searchParams.get('secret') ?? ''
  const counter = Math.floor((Date.now() / 1000 + offsetSeconds) / 30)
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', base32Decode(secret)).update(message).digest()
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f
  const value = hmac.readUInt32BE(offset) & 0x7fffffff
  return String(value % 1_000_000).padStart(6, '0')
}
