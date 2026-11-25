import { defineConfig } from 'vitest/config';

// Root test run: unit + property tests across the workspace. Firestore rules tests need the
// emulator and run separately with `npm run test:rules`.
export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/web/src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'test/rules/**', 'apps/web/e2e/**'],
    testTimeout: 60000,
  },
});
