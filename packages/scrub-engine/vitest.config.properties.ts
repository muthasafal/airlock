import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/properties/**/*.test.ts'],
    testTimeout: 30000, // PBT can take longer
  },
});
