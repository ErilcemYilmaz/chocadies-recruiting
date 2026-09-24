import type { Texte } from '../i18n/uebersetzungen';
import type { Feldfehler, Feldname } from '../komponenten/formular/validierung';
import { ApiFehler } from './client';

/** Allgemeiner Fehlertext in der aktuellen Sprache (Server-Meldungen sind nur deutsch). */
export function fehlertext(fehler: unknown, t: Texte): string {
  if (fehler instanceof ApiFehler && fehler.status === 0) return t.allgemein.serverNichtErreichbar;
  return t.allgemein.unerwarteterFehler;
}

const FORMULARFELDER: Feldname[] = ['nachname', 'vorname', 'email', 'telefon', 'stelle', 'standort', 'sprache', 'bemerkung', 'dokumente', 'status'];

/**
 * Uebersetzt details einer 400-Antwort (feld z.B. "email" oder
 * "dokumente.0.url") in Feldfehler. Die Servermeldung selbst ist technisch
 * und nur deutsch, deshalb wird ein allgemeiner Text beim Feld angezeigt.
 */
export function serverFeldfehler(fehler: ApiFehler, t: Texte): Feldfehler {
  const ergebnis: Feldfehler = {};
  for (const detail of fehler.details) {
    const feld = detail.feld.split('.')[0] as Feldname;
    if (FORMULARFELDER.includes(feld)) ergebnis[feld] = t.formular.fehlerServer;
  }
  return ergebnis;
}
