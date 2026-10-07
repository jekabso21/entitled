import { createHash } from 'node:crypto'

type ByteChunks = AsyncIterable<Uint8Array> | Iterable<Uint8Array>

export function isByteStream(value: unknown): value is AsyncIterable<Uint8Array> {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value
}

export async function sha256OfStream(stream: ByteChunks) {
  const hash = createHash('sha256')
  for await (const chunk of stream) hash.update(chunk)
  return hash.digest('hex')
}
