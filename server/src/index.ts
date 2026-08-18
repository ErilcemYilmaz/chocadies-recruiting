import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDb();
  console.log(`[Server] MongoDB-Verbindung steht. NODE_ENV=${env.nodeEnv}`);
  // TODO Kapitel 4.2: Express-App, REST-Controller, Auth- und Validierungs-Middleware.
}

main().catch((err) => {
  console.error('[Server] Start fehlgeschlagen:', err);
  process.exit(1);
});
