import { z } from 'zod';

// Spiegelt exakt die Constraints aus api/openapi.yaml. Bewusst getrennt von
// den Mongoose-Schemas (models/Bewerbung.model.ts): Zod validiert die
// HTTP-Eingabe (Schicht Eingabevalidierung/VALID), Mongoose validiert die
// Persistenz (Schicht Data-Access-Layer/REPO). Zwei Schichten aus dem
// Komponentendiagramm, zwei getrennte Validierungen.

export const StandortSchema = z.enum([
  'lenzburg',
  'nancy',
  'filiale_ch',
  'filiale_fr',
  'store_international',
]);

export const SpracheSchema = z.enum(['de', 'fr']);

export const BewerbungsstatusSchema = z.enum([
  'eingegangen',
  'in_pruefung',
  'zum_gespraech_eingeladen',
  'abgelehnt',
  'eingestellt',
]);

export const DokumentSchema = z
  .object({
    dateiname: z.string().min(1).max(255),
    typ: z.enum(['lebenslauf', 'motivationsschreiben', 'zeugnis', 'sonstiges']),
    url: z.string().url(),
  })
  .strict();

// requestBody von POST/PUT /bewerbungen: additionalProperties: false in
// openapi.yaml -> .strict() lehnt unbekannte Felder ab (400).
export const BewerbungEingabeSchema = z
  .object({
    nachname: z.string().min(1).max(100),
    vorname: z.string().min(1).max(100),
    email: z.string().email().max(254),
    telefon: z
      .string()
      .regex(/^\+?[0-9 ]{8,20}$/, 'Telefonnummer entspricht nicht dem erwarteten Format.')
      .optional(),
    stelle: z.string().min(1).max(150),
    standort: StandortSchema,
    sprache: SpracheSchema.optional(),
    bemerkung: z.string().max(2000).optional(),
    dokumente: z.array(DokumentSchema).max(10).optional(),
  })
  .strict();

// requestBody von PUT /bewerbungen/{id} (Schema BewerbungAenderung):
// zusaetzlich status, wer ihn setzen darf, prueft der Controller.
export const BewerbungAenderungSchema = BewerbungEingabeSchema.extend({
  status: BewerbungsstatusSchema.optional(),
}).strict();

export const SucheQuerySchema = z.object({
  suchbegriff: z.string().max(100).optional(),
  status: BewerbungsstatusSchema.optional(),
  standort: StandortSchema.optional(),
  seite: z.coerce.number().int().min(1).optional().default(1),
  proSeite: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const BewerbungIdParamSchema = z.object({
  bewerbungId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Ungueltiges Format der Bewerbungs-ID.'),
});

export type BewerbungEingabe = z.infer<typeof BewerbungEingabeSchema>;
export type BewerbungAenderung = z.infer<typeof BewerbungAenderungSchema>;
export type SucheQuery = z.infer<typeof SucheQuerySchema>;
