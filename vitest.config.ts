import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@harmony/core': r('./packages/core/src/index.ts'),
      '@harmony/content': r('./packages/content/src/index.ts'),
      '@harmony/ai': r('./packages/ai/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/web/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'apps/web/src/lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: {
        // Safety core: 100% on every metric (team prompt §8.3).
        'packages/core/src/**/*.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'packages/ai/src/**/*.ts': { statements: 90, branches: 90, functions: 90, lines: 90 },
        'packages/content/src/**/*.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  },
});
