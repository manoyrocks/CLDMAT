import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Use the pre-installed Chromium when present (cloud sandbox); otherwise Playwright's own browser.
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../test-results',
  reporter: [['list'], ['json', { outputFile: '../../test-results/e2e-results.json' }]],
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    ...devices['Pixel 7'],
    launchOptions: { executablePath, args: ['--autoplay-policy=user-gesture-required'] },
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    cwd: '.',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
