import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // A single .env at the repo root serves both apps/web and apps/api,
  // matching .env.example — without this Vite only ever looks in its own
  // package directory and silently falls back to the placeholder Supabase
  // client, which fails DNS resolution at runtime.
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
