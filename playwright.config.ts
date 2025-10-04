import {defineConfig, devices} from '@playwright/test';

const DEV = (process.env.NODE_ENV ?? 'production') === 'development';

export default defineConfig({
  testDir: './tests',
  snapshotDir: `./${DEV ? 'tmp' : 'src'}/e2e/snapshots`,
  testMatch: ['**/*.e2e.ts', '**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide'
    }
  },
  webServer: {
    command: 'npm run build',
    url: 'http://localhost:5866',
    reuseExistingServer: true,
    timeout: 120 * 1000
  },
  use: {
    testIdAttribute: 'data-tid',
    baseURL: 'http://localhost:5866',
    trace: 'on',
    ...(DEV && {headless: false})
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    }
  ]
});
