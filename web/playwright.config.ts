import { defineConfig } from '@playwright/test';
import { loadEnv } from 'vite';

/**
 * End-to-End-Test der SPA gegen die laufende Anwendung (Kapitel 4.4.3).
 * Voraussetzung: Container laufen (docker compose, Port 8080) und die
 * Testdaten sind angelegt (cd server && npm run testdaten:anlegen).
 * Die Demo-Anmeldung kommt aus web/.env.local, wie beim Build der SPA.
 *
 *   npm run test:e2e
 *   E2E_SCREENSHOTS=../docs/systemtest/retest npm run test:e2e
 */
const env = loadEnv('development', process.cwd(), 'VITE_');
process.env.E2E_EMAIL ??= env.VITE_DEMO_EMAIL;
process.env.E2E_PASSWORT ??= env.VITE_DEMO_PASSWORT;

export default defineConfig({
  testDir: './e2e',
  // Die Testfaelle bauen fachlich aufeinander auf (TF-11/12 loeschen die
  // in TF-01 erfasste Bewerbung), deshalb nacheinander in fester Reihenfolge.
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    channel: 'chrome',
    viewport: { width: 1440, height: 1024 },
    locale: 'de-CH',
  },
});
