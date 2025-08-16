import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['business_developer/lead_generation/__tests__/**/*.test.ts'],
  },
  css: {
    postcss: {},
  },
});