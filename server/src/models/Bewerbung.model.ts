import { Schema, model, Document } from 'mongoose';

// Wertelisten 1:1 aus api/openapi.yaml.

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

/**
 * Eintrag im Statusverlauf (Protokoll fuer die Auskunftspflicht nach DSG und
 * DSGVO). Nur intern, wird nie an Clients ausgeliefert.
 */
export interface IStatusEintrag {
  status: Bewerbungsstatus;
  zeitpunkt: Date;
  /** sub aus dem Zugriffstoken der aendernden Person. */
  geaendertVon: string;
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
   * Personalvermittlungsfirma, die die Bewerbung eingereicht hat. Nur fuer
   * die Zugriffssteuerung, wird nie an Clients ausgeliefert.
   */
  vermittlerId?: string;
  statusverlauf: IStatusEintrag[];
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

const StatusEintragSchema = new Schema<IStatusEintrag>(
  {
    status: {
      type: String,
      required: true,
      enum: ['eingegangen', 'in_pruefung', 'zum_gespraech_eingeladen', 'abgelehnt', 'eingestellt'],
    },
    zeitpunkt: { type: Date, required: true },
    geaendertVon: { type: String, required: true },
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
    statusverlauf: { type: [StatusEintragSchema], default: [] },
  },
  {
    // aenderungsdatum wird bei jedem Update automatisch nachgefuehrt.
    timestamps: { createdAt: false, updatedAt: 'aenderungsdatum' },
    versionKey: false,
  },
);

// Filterung nach status und standort beschleunigen.
BewerbungSchema.index({ status: 1, standort: 1 });
// Zugriffsfilterung fuer Personalvermittlungsfirmen beschleunigen.
BewerbungSchema.index({ vermittlerId: 1 });

export const BewerbungModel = model<IBewerbung>('Bewerbung', BewerbungSchema, 'bewerbungen');
