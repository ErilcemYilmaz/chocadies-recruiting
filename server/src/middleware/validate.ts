import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

/**
 * Validiert Body, Query oder Params gegen ein Zod-Schema und ersetzt sie
 * durch die geparste Version. Fehler werden vom errorHandler zu 400.
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
