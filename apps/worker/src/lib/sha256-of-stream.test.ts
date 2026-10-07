import { describe, expect, it } from 'vitest'
import { sha256OfStream } from './sha256-of-stream.ts'

function* chunks(...parts: string[]) {
  for (const part of parts) yield new TextEncoder().encode(part)
}

describe('sha256OfStream', () => {
  it('hashes a stream across chunk boundaries like a single buffer', async () => {
    expect(await sha256OfStream(chunks('hel', 'lo'))).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    )
  })
})
