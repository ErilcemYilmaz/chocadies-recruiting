import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';

/**
 * Zentraler Error-Handler (letzte Middleware in app.ts). Uebersetzt jeden
 * Fehler in das einheitliche Fehler-Schema aus api/openapi.yaml.
 * Muss als letztes Argument eine Fehlerfunktion mit 4 Parametern sein,
 * damit Express sie als Error-Handling-Middleware erkennt.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      code: err.code,
      meldung: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDIERUNG_FEHLGESCHLAGEN',
      meldung: 'Die Anfrage ist fehlerhaft oder unvollstaendig.',
      details: err.issues.map((issue) => ({
        feld: issue.path.join('.') || '(root)',
        problem: issue.message,
      })),
    });
    return;
  }

  // Unerwarteter Fehler: nicht die interne Fehlermeldung an den Client
  // durchreichen, aber serverseitig protokollieren.
  console.error('[Server] Unerwarteter Fehler:', err);
  res.status(500).json({
    code: 'INTERNER_FEHLER',
    meldung: 'Es ist ein unerwarteter Fehler aufgetreten.',
  });
}

/** Faengt 404 fuer nicht definierte Routen ab (z.B. Tippfehler im Pfad). */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    code: 'NICHT_GEFUNDEN',
    meldung: `Route ${req.method} ${req.path} existiert nicht.`,
  });
}
