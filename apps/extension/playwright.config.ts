import { defineConfig } from '@playwright/test';

export default defineConfig({ testDir: './test', reporter: 'list', workers: 1, timeout: 60000 });
