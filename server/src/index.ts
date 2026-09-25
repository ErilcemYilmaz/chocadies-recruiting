import { buildApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDb();
  console.log(`[Server] MongoDB-Verbindung steht. NODE_ENV=${env.nodeEnv}`);

  const app = buildApp();
  const server = app.listen(env.port, () => {
    console.log(`[Server] Basis-Applikation laeuft auf http://localhost:${env.port}/v1`);
  });

  // Container-Plattformen (Docker, Azure Container Apps) beenden Container mit
  // SIGTERM. Laufende Anfragen noch abschliessen und die DB-Verbindung sauber
  // schliessen, statt nach dem Timeout hart abgebrochen zu werden.
  const beenden = (signal: string) => {
    console.log(`[Server] ${signal} empfangen, fahre herunter.`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };
  process.once('SIGTERM', () => beenden('SIGTERM'));
  process.once('SIGINT', () => beenden('SIGINT'));
}

main().catch((err) => {
  console.error('[Server] Start fehlgeschlagen:', err);
  process.exit(1);
});
