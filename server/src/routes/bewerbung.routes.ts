import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  BewerbungAenderungSchema,
  BewerbungEingabeSchema,
  BewerbungIdParamSchema,
  SucheQuerySchema,
} from '../schemas/bewerbung.schema.js';
import {
  bewerbungAendern,
  bewerbungAnlegen,
  bewerbungLesen,
  bewerbungLoeschen,
  bewerbungenSuchen,
} from '../controllers/bewerbung.controller.js';

// Bildet den Pfad /bewerbungen aus api/openapi.yaml 1:1 ab. Jede Route ist
// zuerst durch requireAuth (Interface IBewerbungAPI erfordert bearerAuth)
// und danach durch die passende Zod-Validierung abgesichert, bevor der
// Controller (Bewerbungsdienst-nahe REST-Schicht) aufgerufen wird.
export const bewerbungRouter = Router();

bewerbungRouter.get(
  '/bewerbungen',
  requireAuth,
  validate(SucheQuerySchema, 'query'),
  bewerbungenSuchen,
);

bewerbungRouter.post(
  '/bewerbungen',
  requireAuth,
  validate(BewerbungEingabeSchema, 'body'),
  bewerbungAnlegen,
);

bewerbungRouter.get(
  '/bewerbungen/:bewerbungId',
  requireAuth,
  validate(BewerbungIdParamSchema, 'params'),
  bewerbungLesen,
);

bewerbungRouter.put(
  '/bewerbungen/:bewerbungId',
  requireAuth,
  validate(BewerbungIdParamSchema, 'params'),
  validate(BewerbungAenderungSchema, 'body'),
  bewerbungAendern,
);

bewerbungRouter.delete(
  '/bewerbungen/:bewerbungId',
  requireAuth,
  validate(BewerbungIdParamSchema, 'params'),
  bewerbungLoeschen,
);
