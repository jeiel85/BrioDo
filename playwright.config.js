import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',

  timeout: 30000,
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    locale: 'ko-KR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: process.env.CI
    ? [
        // CI: Desktop Chrome only (mobile emulation is unreliable in headless CI)
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        // Local: all browsers
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'Android Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'iOS Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
})
