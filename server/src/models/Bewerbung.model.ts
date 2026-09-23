import { Schema, model, Document } from 'mongoose';

// Werte 1:1 aus api/openapi.yaml uebernommen, damit Datenmodell und
// Web-API-Spezifikation nicht auseinanderlaufen.

export type Standort =
  | 'lenzburg'
  | 'nancy'
  | 'filiale_ch'
  | 'filiale_fr'
  | 'store_international';

export type Sprache = 'de' | 'fr';

export type Bewerbungsstatus =
  | 'eingegangen'
  | 'in_pruefung'
  | 'zum_gespraech_eingeladen'
  | 'abgelehnt'
  | 'eingestellt';

export type DokumentTyp = 'lebenslauf' | 'motivationsschreiben' | 'zeugnis' | 'sonstiges';

export type Quelle = 'webshop' | 'mobile_app' | 'linkedin' | 'personalvermittlung';

export interface IDokument {
  dateiname: string;
  typ: DokumentTyp;
  url: string;
}

export interface IBewerbung extends Document {
  nachname: string;
  vorname: string;
  email: string;
  telefon?: string;
  stelle: string;
  standort: Standort;
  sprache: Sprache;
  status: Bewerbungsstatus;
  bemerkung?: string;
  dokumente: IDokument[];
  quelle?: Quelle;
  eingangsdatum: Date;
  aenderungsdatum?: Date;
  /**
   * Interne Kennung der Personalvermittlungsfirma, welche die Bewerbung
   * eingereicht hat. Nicht Teil des oeffentlichen Bewerbung-Schemas aus
   * api/openapi.yaml, dient ausschliesslich der Zugriffssteuerung (AUTH-
   * Komponente): Personalvermittlungsfirmen sehen gemaess openapi.yaml
   * (Zeilen 43-45) nur ihre eigenen Bewerbungen. Wird nie an den Client
   * serialisiert, siehe controllers/bewerbung.controller.ts#serialisieren.
   */
  vermittlerId?: string;
}

const DokumentSchema = new Schema<IDokument>(
  {
    dateiname: { type: String, required: true, maxlength: 255 },
    typ: {
      type: String,
      required: true,
      enum: ['lebenslauf', 'motivationsschreiben', 'zeugnis', 'sonstiges'],
    },
    url: { type: String, required: true },
  },
  { _id: false },
);

const BewerbungSchema = new Schema<IBewerbung>(
  {
    nachname: { type: String, required: true, minlength: 1, maxlength: 100, trim: true },
    vorname: { type: String, required: true, minlength: 1, maxlength: 100, trim: true },
    email: {
      type: String,
      required: true,
      maxlength: 254,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ungueltige E-Mail-Adresse'],
    },
    telefon: {
      type: String,
      match: [/^\+?[0-9 ]{8,20}$/, 'Ungueltiges Telefonformat'],
    },
    stelle: { type: String, required: true, minlength: 1, maxlength: 150, trim: true },
    standort: {
      type: String,
      required: true,
      enum: ['lenzburg', 'nancy', 'filiale_ch', 'filiale_fr', 'store_international'],
    },
    sprache: {
      type: String,
      enum: ['de', 'fr'],
      default: 'de',
    },
    status: {
      type: String,
      enum: ['eingegangen', 'in_pruefung', 'zum_gespraech_eingeladen', 'abgelehnt', 'eingestellt'],
      default: 'eingegangen',
    },
    bemerkung: { type: String, maxlength: 2000 },
    dokumente: {
      type: [DokumentSchema],
      default: [],
      validate: [
        (v: IDokument[]) => v.length <= 10,
        'Maximal 10 Dokumente pro Bewerbung.',
      ],
    },
    quelle: {
      type: String,
      enum: ['webshop', 'mobile_app', 'linkedin', 'personalvermittlung'],
    },
    eingangsdatum: { type: Date, default: () => new Date(), immutable: true },
    aenderungsdatum: { type: Date },
    vermittlerId: { type: String, select: true },
  },
  {
    // aenderungsdatum wird bei jedem Update automatisch nachgefuehrt.
    timestamps: { createdAt: false, updatedAt: 'aenderungsdatum' },
    versionKey: false,
  },
);

// Freitextsuche ueber Nachname, Vorname, Stelle (Endpoint GET /bewerbungen, Parameter suchbegriff).
BewerbungSchema.index({ nachname: 'text', vorname: 'text', stelle: 'text' });
// Filterung nach status und standort beschleunigen.
BewerbungSchema.index({ status: 1, standort: 1 });
// Zugriffsfilterung fuer Personalvermittlungsfirmen beschleunigen.
BewerbungSchema.index({ vermittlerId: 1 });

export const BewerbungModel = model<IBewerbung>('Bewerbung', BewerbungSchema, 'bewerbungen');
