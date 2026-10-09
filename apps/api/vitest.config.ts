import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const envFile = new URL('../../.env', import.meta.url)
if (existsSync(envFile)) process.loadEnvFile(envFile)

const { testDatabaseUrl } = await import('./src/test/test-database-url.ts')

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/test/global-setup.ts'],
    env: { DATABASE_URL: testDatabaseUrl, NODE_ENV: 'test' },
    // Suites share one database; running them in sequence keeps fixtures predictable.
    fileParallelism: false,
    // The first Markdown render loads Shiki grammars, which is slow on a busy machine.
    testTimeout: 30_000,
  },
})
