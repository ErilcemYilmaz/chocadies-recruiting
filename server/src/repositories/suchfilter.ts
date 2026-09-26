import { FilterQuery } from 'mongoose';
import { IBewerbung } from '../models/Bewerbung.model.js';

/**
 * Filter fuer die Freitextsuche (Parameter suchbegriff, GET /bewerbungen):
 * Jedes Wort des Suchbegriffs muss am Anfang eines Wortes in Nachname,
 * Vorname oder Stelle stehen, ohne Gross-/Kleinschreibung.
 * Beispiel: "Roch" findet "Rochat", "choco lenz" findet "Chocolatier/in
 * Produktion Lenzburg".
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
