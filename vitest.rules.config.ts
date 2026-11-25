import { defineConfig } from 'vitest/config';

// Firestore security rules tests; run inside the emulator via `npm run test:rules`.
export default defineConfig({
  test: { include: ['test/rules/**/*.test.ts'], testTimeout: 30000, fileParallelism: false },
});
