import { defineConfig, devices } from '@playwright/test'

// Runs against an already running stack (pnpm dev or docker compose) seeded with demo data.
export default defineConfig({
  testDir: 'test/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
