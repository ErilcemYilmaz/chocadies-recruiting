// Typen der Web-API, 1:1 nach api/openapi.yaml (components/schemas).
// Die Wertelisten der Enums sind als Konstanten exportiert, damit Auswahllisten
// und Anzeigenamen (i18n/anzeigenamen.ts) dieselbe Quelle verwenden.

export const STATUS_WERTE = [
  'eingegangen',
  'in_pruefung',
  'zum_gespraech_eingeladen',
  'abgelehnt',
  'eingestellt',
] as const;
export type Bewerbungsstatus = (typeof STATUS_WERTE)[number];

export const STANDORT_WERTE = [
  'lenzburg',
  'nancy',
  'filiale_ch',
  'filiale_fr',
  'store_international',
] as const;
export type Standort = (typeof STANDORT_WERTE)[number];

export const SPRACH_WERTE = ['de', 'fr'] as const;
export type Sprache = (typeof SPRACH_WERTE)[number];

export const DOKUMENTTYP_WERTE = ['lebenslauf', 'motivationsschreiben', 'zeugnis', 'sonstiges'] as const;
export type Dokumenttyp = (typeof DOKUMENTTYP_WERTE)[number];

export const QUELLE_WERTE = ['webshop', 'mobile_app', 'linkedin', 'personalvermittlung'] as const;
export type Quelle = (typeof QUELLE_WERTE)[number];

export interface Dokument {
  dateiname: string;
  typ: Dokumenttyp;
  url: string;
}

/** Schema BewerbungEingabe (POST). */
export interface BewerbungEingabe {
  nachname: string;
  vorname: string;
  email: string;
  telefon?: string;
  stelle: string;
  standort: Standort;
  sprache?: Sprache;
  bemerkung?: string;
  dokumente?: Dokument[];
}

/** Schema BewerbungAenderung (PUT), status nur fuer interne Benutzende. */
export interface BewerbungAenderung extends BewerbungEingabe {
  status?: Bewerbungsstatus;
}

/** Schema Bewerbung (Antwort). */
export interface Bewerbung {
  id: string;
  nachname: string;
  vorname: string;
  email: string;
  telefon?: string;
  stelle: string;
  standort: Standort;
  sprache?: Sprache;
  status: Bewerbungsstatus;
  bemerkung?: string;
  dokumente?: Dokument[];
  quelle?: Quelle;
  eingangsdatum: string;
  aenderungsdatum?: string;
}

/** Schema Bewerbungsliste. */
export interface Bewerbungsliste {
  treffer: Bewerbung[];
  seite: number;
  proSeite: number;
  gesamt: number;
}

export interface SuchParameter {
  suchbegriff?: string;
  status?: Bewerbungsstatus;
  standort?: Standort;
  seite?: number;
  proSeite?: number;
}

/** Schema Fehler. */
export interface FehlerAntwort {
  code: string;
  meldung: string;
  details?: { feld: string; problem: string }[];
}
