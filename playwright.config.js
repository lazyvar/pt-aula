// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    launchOptions: { slowMo: Number(process.env.SLOW_MO) || 0 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `DATABASE_URL=${process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/pt_aula_test'} PORT=${PORT} node server.js`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
