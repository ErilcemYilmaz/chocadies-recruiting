import type {
  Bewerbung,
  BewerbungAenderung,
  BewerbungEingabe,
  Bewerbungsliste,
  FehlerAntwort,
  SuchParameter,
} from './typen';

/**
 * HTTP-Client fuer die Web-API: einzige Stelle, die fetch aufruft und das
 * Bearer-Token setzt.
 */

const BASIS_URL = '/v1';

export class ApiFehler extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: { feld: string; problem: string }[];

  constructor(status: number, antwort?: Partial<FehlerAntwort>) {
    super(antwort?.meldung ?? `HTTP ${status}`);
    this.name = 'ApiFehler';
    this.status = status;
    this.code = antwort?.code ?? 'UNBEKANNT';
    this.details = antwort?.details ?? [];
  }
}

let token: string | null = null;
let beiNichtAuthentisiert: () => void = () => {};

/** Wird vom AuthKontext gesetzt. */
export function setzeToken(neuesToken: string | null): void {
  token = neuesToken;
}

/** Wird vom AuthKontext gesetzt: bei 401 abmelden und zur Anmeldung. */
export function setzeBeiNichtAuthentisiert(callback: () => void): void {
  beiNichtAuthentisiert = callback;
}

async function anfrage<T>(methode: string, pfad: string, body?: unknown): Promise<T> {
  let antwort: Response;
  try {
    antwort = await fetch(`${BASIS_URL}${pfad}`, {
      method: methode,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Netzwerkfehler (Server nicht erreichbar) als Status 0 melden.
    throw new ApiFehler(0, { code: 'NETZWERK', meldung: 'Server nicht erreichbar.' });
  }

  if (antwort.status === 204) return undefined as T;

  const inhalt = await antwort.json().catch(() => undefined);
  if (!antwort.ok) {
    if (antwort.status === 401) beiNichtAuthentisiert();
    throw new ApiFehler(antwort.status, inhalt as FehlerAntwort | undefined);
  }
  return inhalt as T;
}

function alsQuery(parameter: SuchParameter): string {
  const query = new URLSearchParams();
  for (const [schluessel, wert] of Object.entries(parameter)) {
    if (wert !== undefined && wert !== '') query.set(schluessel, String(wert));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

export const bewerbungApi = {
  suchen: (parameter: SuchParameter) => anfrage<Bewerbungsliste>('GET', `/bewerbungen${alsQuery(parameter)}`),
  lesen: (id: string) => anfrage<Bewerbung>('GET', `/bewerbungen/${encodeURIComponent(id)}`),
  anlegen: (eingabe: BewerbungEingabe) => anfrage<Bewerbung>('POST', '/bewerbungen', eingabe),
  aendern: (id: string, aenderung: BewerbungAenderung) =>
    anfrage<Bewerbung>('PUT', `/bewerbungen/${encodeURIComponent(id)}`, aenderung),
  loeschen: (id: string) => anfrage<void>('DELETE', `/bewerbungen/${encodeURIComponent(id)}`),
};
