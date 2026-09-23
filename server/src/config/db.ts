import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

/**
 * Baut die Verbindung zur MongoDB (Atlas) ueber Mongoose auf.
 * Der Verbindungsstring stammt aus MONGODB_URI (lokale server/.env, siehe README.md).
 */
export async function connectDb(): Promise<typeof mongoose> {
  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Verbindung hergestellt.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Verbindungsfehler:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Verbindung getrennt.');
  });

  return mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 8000,
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
