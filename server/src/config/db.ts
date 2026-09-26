import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

/** Verbindet Mongoose mit der MongoDB aus MONGODB_URI. */
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
