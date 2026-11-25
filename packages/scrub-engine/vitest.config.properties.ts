import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/properties/**/*.prop.ts'],
    testTimeout: 30000, // PBT can take longer
  },
});
