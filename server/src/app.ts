import express, { Express } from 'express';
import { bewerbungRouter } from './routes/bewerbung.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * Baut die Express-App auf, ohne sie zu starten. Getrennt von index.ts,
 * damit Tests die App ohne Port und Datenbankverbindung verwenden koennen.
 */
export function buildApp(): Express {
  const app = express();

  app.use(express.json());
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Basis-Pfad gemaess api/openapi.yaml (servers: .../v1).
  app.use('/v1', bewerbungRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
