import { describe, expect, it } from 'vitest'
import { createReleaseInputSchema } from './create-release-input.ts'

const productId = '0199f0c4-2a6e-7c3e-9a51-2d4b8f1e6a00'

describe('createReleaseInputSchema', () => {
  it('fills defaults for optional fields', () => {
    const parsed = createReleaseInputSchema.parse({ productId, version: ' 2.1.0 ' })

    expect(parsed).toEqual({
      productId,
      version: '2.1.0',
      title: '',
      changelog: '',
      installInstructions: '',
      minRevisionId: null,
      maxRevisionId: null,
    })
  })

  it('rejects unknown keys so clients cannot set server-owned fields', () => {
    const result = createReleaseInputSchema.safeParse({
      productId,
      version: '1.0.0',
      status: 'published',
    })

    expect(result.success).toBe(false)
  })
})
