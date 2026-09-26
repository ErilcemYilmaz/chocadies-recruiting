/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Die Server-App setzt keine CORS-Header. Im Entwicklungsbetrieb leitet der
// Vite-Server deshalb /v1 an die lokale API weiter (gleicher Ursprung fuer den
// Browser). Produktiv liefert ein Reverse Proxy SPA und API gemeinsam aus.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/v1': process.env.API_URL ?? 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
});
