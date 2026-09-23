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
    // Fake microphone (a test tone) so recording flows can be exercised end to end (AS-09).
    permissions: ['microphone'],
    launchOptions: { executablePath, args: ['--autoplay-policy=user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    cwd: '.',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
