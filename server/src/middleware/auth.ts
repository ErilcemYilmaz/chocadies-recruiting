import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';

/**
 * Prueft das JWT-Bearer-Token (bearerAuth in api/openapi.yaml) und legt
 * Benutzer und Rolle in req.auth ab. Die Tokens stellt ein vorgelagerter
 * Anmeldedienst aus; fuer Tests erzeugt scripts/generateTestToken.ts welche.
 */

export type Scope = 'intern' | 'personalvermittlung';

export interface AuthKontext {
  sub: string;
  scope: Scope;
  /** Nur gesetzt fuer scope 'personalvermittlung': Kennung der Firma. */
  firmaId?: string;
}

declare global {
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
