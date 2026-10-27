
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 30_000,

  expect: {
    timeout: 5_000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL:
      process.env.API_BASE_URL ??
      'https://restful-booker.herokuapp.com',

    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {},
    },
  ],
});
