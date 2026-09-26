import { FilterQuery } from 'mongoose';
import { IBewerbung } from '../models/Bewerbung.model.js';

/**
 * Filter fuer die Freitextsuche (Parameter suchbegriff, GET /bewerbungen).
 *
 * Findet Bewerbungen, bei denen jedes Wort des Suchbegriffs am Anfang eines
 * Wortes in Nachname, Vorname oder Stelle steht, ohne Gross-/Kleinschreibung.
 * Beispiel: "Roch" findet "Rochat", "choco lenz" findet "Chocolatier/in
 * Produktion Lenzburg".
 *
 * Ersetzt die fruehere MongoDB-Volltextsuche ($text), die nur ganze Woerter
 * fand (Befund B-2 aus dem Systemtest 4.4.3, tests/systemtest-4.4.3.md).
 */

const SUCHFELDER = ['nachname', 'vorname', 'stelle'] as const;

/** Maskiert Sonderzeichen, damit Eingaben nie als regulaerer Ausdruck wirken (Schutz vor ReDoS/Injection). */
function maskieren(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function suchbegriffFilter(suchbegriff: string): FilterQuery<IBewerbung> | undefined {
  const woerter = suchbegriff.trim().split(/\s+/).filter(Boolean);
  if (woerter.length === 0) return undefined;

  // Wortanfang: Beginn des Feldes oder nach Leerzeichen, Bindestrich, Schraegstrich.
  const bedingungen = woerter.map((wort) => ({
    $or: SUCHFELDER.map((feld) => ({
      [feld]: { $regex: `(^|[\\s/-])${maskieren(wort)}`, $options: 'i' },
    })),
  }));

  return { $and: bedingungen };
}
