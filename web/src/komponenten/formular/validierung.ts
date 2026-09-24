import type { BewerbungAenderung, Bewerbungsstatus, Dokument, Sprache, Standort } from '../../api/typen';
import type { Texte } from '../../i18n/uebersetzungen';

/**
 * Clientseitige Pruefung, gespiegelt aus den Constraints von
 * BewerbungEingabe in api/openapi.yaml (und server/src/schemas). Sie ersetzt
 * die Serverpruefung nicht, sondern zeigt Fehler sofort beim Feld an.
 */

export interface Formularwerte {
  status: Bewerbungsstatus | '';
  nachname: string;
  vorname: string;
  email: string;
  telefon: string;
  stelle: string;
  standort: Standort | '';
  sprache: Sprache;
  bemerkung: string;
  dokumente: Dokument[];
}

export type Feldname = keyof Formularwerte;
export type Feldfehler = Partial<Record<Feldname, string>>;

export const LEERE_WERTE: Formularwerte = {
  status: '',
  nachname: '',
  vorname: '',
  email: '',
  telefon: '',
  stelle: '',
  standort: '',
  sprache: 'de',
  bemerkung: '',
  dokumente: [],
};

export const MAX_DOKUMENTE = 10;

// Gleiche Muster wie Server (Mongoose-Match bzw. openapi.yaml pattern).
const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFON_MUSTER = /^\+?[0-9 ]{8,20}$/;

export function pruefeFeld(feld: Feldname, werte: Formularwerte, t: Texte): string | undefined {
  const f = t.formular;
  const text = (wert: string, maximum: number, pflicht: boolean) => {
    if (pflicht && !wert.trim()) return f.fehlerPflicht;
    if (wert.length > maximum) return f.fehlerZuLang(maximum);
    return undefined;
  };

  switch (feld) {
    case 'nachname':
      return text(werte.nachname, 100, true);
    case 'vorname':
      return text(werte.vorname, 100, true);
    case 'email':
      if (!werte.email.trim()) return f.fehlerPflicht;
      if (werte.email.length > 254 || !EMAIL_MUSTER.test(werte.email.trim())) return f.fehlerEmail;
      return undefined;
    case 'telefon':
      return werte.telefon.trim() && !TELEFON_MUSTER.test(werte.telefon.trim()) ? f.fehlerTelefon : undefined;
    case 'stelle':
      return text(werte.stelle, 150, true);
    case 'standort':
      return werte.standort ? undefined : f.fehlerStandort;
    case 'bemerkung':
      return text(werte.bemerkung, 2000, false);
    case 'dokumente':
      return werte.dokumente.length > MAX_DOKUMENTE ? f.fehlerZuVieleDateien : undefined;
    default:
      return undefined;
  }
}

const GEPRUEFTE_FELDER: Feldname[] = ['nachname', 'vorname', 'email', 'telefon', 'stelle', 'standort', 'bemerkung', 'dokumente'];

export function pruefeAlle(werte: Formularwerte, t: Texte): Feldfehler {
  const fehler: Feldfehler = {};
  for (const feld of GEPRUEFTE_FELDER) {
    const meldung = pruefeFeld(feld, werte, t);
    if (meldung) fehler[feld] = meldung;
  }
  return fehler;
}

/**
 * Baut den Anfragekoerper. Leere optionale Felder werden weggelassen, weil
 * die API leere Strings z.B. beim Telefon als ungueltig ablehnt. Ausnahme
 * Bemerkung beim Bearbeiten: Ein leerer String loescht die bisherige Bemerkung.
 */
export function alsAnfrage(werte: Formularwerte, bearbeiten: boolean): BewerbungAenderung {
  const anfrage: BewerbungAenderung = {
    nachname: werte.nachname.trim(),
    vorname: werte.vorname.trim(),
    email: werte.email.trim(),
    stelle: werte.stelle.trim(),
    standort: werte.standort as Standort,
    sprache: werte.sprache,
    dokumente: werte.dokumente,
  };
  if (werte.telefon.trim()) anfrage.telefon = werte.telefon.trim();
  if (werte.bemerkung.trim() || bearbeiten) anfrage.bemerkung = werte.bemerkung;
  if (bearbeiten && werte.status) anfrage.status = werte.status;
  return anfrage;
}
