import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

/**
 * Eingabevalidierung (Komponente VALID im Architekturdiagramm). Validiert
 * Body, Query oder Params gegen ein Zod-Schema und ersetzt sie durch die
 * geparste (z.B. mit Defaults befuellte) Version. Wirft bei einem Fehler
 * einen ZodError, den der zentrale errorHandler in eine 400-Antwort im
 * Fehler-Schema uebersetzt.
 */
type Quelle = 'body' | 'query' | 'params';

export function validate(schema: ZodType, quelle: Quelle = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const ergebnis = schema.parse(req[quelle]);
      (req as unknown as Record<Quelle, unknown>)[quelle] = ergebnis;
      next();
    } catch (err) {
      next(err);
    }
  };
}
