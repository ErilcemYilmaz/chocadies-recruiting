import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';

/**
 * Authentisierung und Autorisierung (Komponente AUTH im Architekturdiagramm,
 * docs/architektur_komponenten.puml). Prueft das JWT-Bearer-Token aus dem
 * Authorization-Header gemaess components/securitySchemes/bearerAuth in
 * api/openapi.yaml.
 *
 * Die eigentliche Ausstellung der Tokens (Login der internen Benutzenden
 * bzw. technischer Benutzer der Personalvermittlungsfirmen) ist nicht Teil
 * dieser Web-API, siehe openapi.yaml, Beschreibung von bearerAuth. Fuer
 * lokale Entwicklung und Postman-Tests erzeugt scripts/generateTestToken.ts
 * gueltige Test-Tokens mit demselben Secret.
 */

export type Scope = 'intern' | 'personalvermittlung';

export interface AuthKontext {
  sub: string;
  scope: Scope;
  /** Nur gesetzt fuer scope 'personalvermittlung': Kennung der Firma. */
  firmaId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthKontext;
    }
  }
}

function istAuthKontext(payload: unknown): payload is AuthKontext {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  if (typeof p.sub !== 'string') return false;
  if (p.scope !== 'intern' && p.scope !== 'personalvermittlung') return false;
  if (p.scope === 'personalvermittlung' && typeof p.firmaId !== 'string') return false;
  return true;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(ApiError.nichtAuthentisiert());
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!istAuthKontext(payload)) {
      next(ApiError.nichtAuthentisiert('Zugriffstoken hat ein ungueltiges Format.'));
      return;
    }
    req.auth = payload;
    next();
  } catch {
    next(ApiError.nichtAuthentisiert('Zugriffstoken ist ungueltig oder abgelaufen.'));
  }
}
