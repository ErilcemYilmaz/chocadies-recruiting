import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Sprache } from '../api/typen';
import { uebersetzungen, type Texte } from './uebersetzungen';

/**
 * Sprachumschaltung DE/FR. Die gewaehlte Sprache wird im Browser gemerkt
 * (reine Komfortfunktion, faellt bei gesperrtem Speicher auf Deutsch zurueck)
 * und als lang-Attribut am html-Element gesetzt, damit Screenreader die
 * richtige Aussprache verwenden.
 */

const SPEICHER_SCHLUESSEL = 'chocadies.sprache';

interface SprachWert {
  sprache: Sprache;
  setzeSprache: (sprache: Sprache) => void;
  t: Texte;
  /** Datum als TT.MM.JJJJ im Format der aktuellen Sprache (de-CH / fr-CH). */
  datum: (iso: string | undefined) => string;
}

const SprachKontext = createContext<SprachWert | null>(null);

function gespeicherteSprache(): Sprache {
  try {
    const wert = localStorage.getItem(SPEICHER_SCHLUESSEL);
    return wert === 'fr' ? 'fr' : 'de';
  } catch {
    return 'de';
  }
}

export function SprachAnbieter({ children }: { children: ReactNode }) {
  const [sprache, setSprache] = useState<Sprache>(gespeicherteSprache);

  useEffect(() => {
    document.documentElement.lang = sprache;
    document.title = uebersetzungen[sprache].app.dokumenttitel;
  }, [sprache]);

  const setzeSprache = useCallback((neu: Sprache) => {
    setSprache(neu);
    try {
      localStorage.setItem(SPEICHER_SCHLUESSEL, neu);
    } catch {
      // Speicher nicht verfuegbar: Umschaltung gilt dann nur fuer diese Sitzung.
    }
  }, []);

  const wert = useMemo<SprachWert>(() => {
    const format = new Intl.DateTimeFormat(sprache === 'fr' ? 'fr-CH' : 'de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return {
      sprache,
      setzeSprache,
      t: uebersetzungen[sprache],
      datum: (iso) => (iso ? format.format(new Date(iso)) : uebersetzungen[sprache].allgemein.keineAngabe),
    };
  }, [sprache, setzeSprache]);

  return <SprachKontext.Provider value={wert}>{children}</SprachKontext.Provider>;
}

export function useSprache(): SprachWert {
  const wert = useContext(SprachKontext);
  if (!wert) throw new Error('useSprache ausserhalb von SprachAnbieter verwendet.');
  return wert;
}
