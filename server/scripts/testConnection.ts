import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../src/config/db.js';

/**
 * Prueft den MONGODB_URI aus .env: verbindet, pingt den Atlas-Cluster an
 * und trennt sauber wieder. Aufruf: npm run db:test (im Ordner server).
 */
async function main() {
  console.log('Verbinde mit MongoDB...');
  await connectDb();

  const admin = mongoose.connection.db?.admin();
  const ping = await admin?.ping();
  console.log('Ping-Antwort:', ping);

  const dbName = mongoose.connection.db?.databaseName;
  console.log(`Verbunden mit Datenbank: ${dbName}`);

  await disconnectDb();
  console.log('Verbindung sauber getrennt. Setup erfolgreich.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verbindungstest fehlgeschlagen:', err);
  process.exit(1);
});
