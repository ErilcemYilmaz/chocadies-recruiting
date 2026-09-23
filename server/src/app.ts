import express, { Express } from 'express';
import { bewerbungRouter } from './routes/bewerbung.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * Baut die Express-App auf, ohne sie zu starten (kein app.listen hier).
 * Getrennt von index.ts, damit Vitest/Supertest die App importieren und
 * gegen sie testen koennen, ohne einen echten Port zu belegen oder eine
 * echte Datenbankverbindung zu benoetigen.
 */
export function buildApp(): Express {
  const app = express();

  app.use(express.json());
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Basis-Pfad gemaess servers/-Eintraegen in api/openapi.yaml (.../v1).
  app.use('/v1', bewerbungRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
