import { buildApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDb();
  console.log(`[Server] MongoDB-Verbindung steht. NODE_ENV=${env.nodeEnv}`);

  const app = buildApp();
  app.listen(env.port, () => {
    console.log(`[Server] Basis-Applikation laeuft auf http://localhost:${env.port}/v1`);
  });
}

main().catch((err) => {
  console.error('[Server] Start fehlgeschlagen:', err);
  process.exit(1);
});
