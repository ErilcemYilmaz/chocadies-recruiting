import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setzeBeiNichtAuthentisiert, setzeToken } from '../api/client';

/**
 * Anmeldung (Prototyp): Die API stellt keine Tokens aus. Bis ein
 * Anmeldedienst angebunden ist, wird ein Demo-Konto aus web/.env.local
 * geprueft und ein Test-Token verwendet (nur fuer die lokale Entwicklung).
 * Beim Wechsel auf einen echten Dienst aendert sich nur anmelden().
 */

export interface Benutzer {
  name: string;
  rolle: string;
  email: string;
}

interface Sitzung {
  benutzer: Benutzer;
  token: string;
}

interface AuthWert {
  benutzer: Benutzer | null;
  /** true, wenn die letzte Sitzung wegen 401 der API beendet wurde. */
  sitzungAbgelaufen: boolean;
  anmelden: (email: string, passwort: string) => boolean;
  abmelden: () => void;
}

const AuthKontext = createContext<AuthWert | null>(null);
const SPEICHER_SCHLUESSEL = 'chocadies.sitzung';

function gespeicherteSitzung(): Sitzung | null {
  try {
    const roh = sessionStorage.getItem(SPEICHER_SCHLUESSEL);
    return roh ? (JSON.parse(roh) as Sitzung) : null;
  } catch {
    return null;
  }
}

function speichereSitzung(sitzung: Sitzung | null): void {
  try {
    if (sitzung) sessionStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(sitzung));
    else sessionStorage.removeItem(SPEICHER_SCHLUESSEL);
  } catch {
    // Ohne Speicher gilt die Anmeldung nur bis zum Neuladen der Seite.
  }
}

export function AuthAnbieter({ children }: { children: ReactNode }) {
  const [sitzung, setSitzung] = useState<Sitzung | null>(() => {
    const gespeichert = gespeicherteSitzung();
    // Token schon beim ersten Rendern setzen, sonst laufen die ersten
    // Anfragen nach einem Neuladen ohne Authorization-Header.
    setzeToken(gespeichert?.token ?? null);
    return gespeichert;
  });
  const [sitzungAbgelaufen, setSitzungAbgelaufen] = useState(false);

  const beenden = useCallback((abgelaufen: boolean) => {
    setzeToken(null);
    speichereSitzung(null);
    setSitzung(null);
    setSitzungAbgelaufen(abgelaufen);
  }, []);

  useEffect(() => {
    setzeBeiNichtAuthentisiert(() => beenden(true));
  }, [beenden]);

  const anmelden = useCallback((email: string, passwort: string) => {
    const env = import.meta.env;
    const korrekt =
      !!env.VITE_DEMO_EMAIL &&
      !!env.VITE_API_TOKEN &&
      email.trim().toLowerCase() === env.VITE_DEMO_EMAIL.toLowerCase() &&
      passwort === env.VITE_DEMO_PASSWORT;
    if (!korrekt) return false;

    const neu: Sitzung = {
      token: env.VITE_API_TOKEN!,
      benutzer: {
        name: env.VITE_DEMO_NAME ?? env.VITE_DEMO_EMAIL!,
        rolle: env.VITE_DEMO_ROLLE ?? '',
        email: env.VITE_DEMO_EMAIL!,
      },
    };
    setzeToken(neu.token);
    speichereSitzung(neu);
    setSitzung(neu);
    setSitzungAbgelaufen(false);
    return true;
  }, []);

  const wert = useMemo<AuthWert>(
    () => ({
      benutzer: sitzung?.benutzer ?? null,
      sitzungAbgelaufen,
      anmelden,
      abmelden: () => beenden(false),
    }),
    [sitzung, sitzungAbgelaufen, anmelden, beenden],
  );

  return <AuthKontext.Provider value={wert}>{children}</AuthKontext.Provider>;
}

export function useAuth(): AuthWert {
  const wert = useContext(AuthKontext);
  if (!wert) throw new Error('useAuth ausserhalb von AuthAnbieter verwendet.');
  return wert;
}
