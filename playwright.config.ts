import { defineConfig } from '@playwright/test';

const e2eDevServerCommand = process.platform === 'win32'
  ? 'set VITE_E2E=1&& npm run dev -- --host 127.0.0.1 --port 4173'
  : 'VITE_E2E=1 npm run dev -- --host 127.0.0.1 --port 4173';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  maxFailures: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: e2eDevServerCommand,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
