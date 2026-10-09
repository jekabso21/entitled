import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // The first render loads Shiki grammars, which can exceed 5s on a busy CI runner.
    testTimeout: 30_000,
  },
})
