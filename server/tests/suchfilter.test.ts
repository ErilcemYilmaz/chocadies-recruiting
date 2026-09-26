import { describe, expect, it } from 'vitest';
import { suchbegriffFilter } from '../src/repositories/suchfilter.js';

// Prueft den Suchfilter ohne Datenbank, indem die erzeugten regulaeren
// Ausdruecke direkt auf Beispielwerte angewendet werden (so wie MongoDB es tut).
function trifft(suchbegriff: string, felder: { nachname: string; vorname: string; stelle: string }): boolean {
  const filter = suchbegriffFilter(suchbegriff) as { $and: { $or: Record<string, { $regex: string; $options: string }>[] }[] };
  return filter.$and.every((bedingung) =>
    bedingung.$or.some((feldbedingung) => {
      const [feld, { $regex, $options }] = Object.entries(feldbedingung)[0];
      return new RegExp($regex, $options).test(felder[feld as keyof typeof felder]);
    }),
  );
}

const rochat = { nachname: 'Rochat', vorname: 'Claudine', stelle: 'Konditorin' };
const keller = { nachname: 'Keller', vorname: 'Anna', stelle: 'Chocolatier/in Produktion Lenzburg' };

describe('Suchfilter (Suche nach Wortanfang)', () => {
  it('findet Wortanfaenge ohne Gross-/Kleinschreibung', () => {
    expect(trifft('Roch', rochat)).toBe(true);
    expect(trifft('roch', rochat)).toBe(true);
    expect(trifft('Rochat', rochat)).toBe(true);
  });

  it('findet nicht mitten im Wort', () => {
    expect(trifft('chat', rochat)).toBe(false);
  });

  it('findet Wortanfaenge nach Schraegstrich und Leerzeichen, mehrere Woerter mit UND', () => {
    expect(trifft('Produktion', keller)).toBe(true);
    expect(trifft('choco lenz', keller)).toBe(true);
    expect(trifft('choco nancy', keller)).toBe(false);
  });

  it('behandelt Sonderzeichen als normalen Text (kein Regex aus der Eingabe)', () => {
    expect(trifft('.*', rochat)).toBe(false);
    expect(() => suchbegriffFilter('(((')).not.toThrow();
    expect(trifft('(', { nachname: '(Test', vorname: 'x', stelle: 'y' })).toBe(true);
  });

  it('liefert fuer einen leeren Suchbegriff keinen Filter', () => {
    expect(suchbegriffFilter('   ')).toBeUndefined();
  });
});
