import { defineConfig } from '@playwright/test';

const PRODUCTION_BASE_URL = 'http://127.0.0.1:4173/stellar-empires/';

export default defineConfig({
  testDir: './e2e-production',
  testMatch: '**/*.pw.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-production-report' }],
  ],
  use: {
    baseURL: PRODUCTION_BASE_URL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: PRODUCTION_BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
