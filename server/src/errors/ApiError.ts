/**
 * Fehlerklasse der Web-API; der errorHandler macht daraus eine Antwort im
 * Fehler-Schema aus api/openapi.yaml.
 */
export interface FehlerDetail {
  feld: string;
  problem: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: FehlerDetail[];

  constructor(status: number, code: string, meldung: string, details?: FehlerDetail[]) {
    super(meldung);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static nichtAuthentisiert(meldung = 'Kein gueltiges Zugriffstoken vorhanden.'): ApiError {
    return new ApiError(401, 'NICHT_AUTHENTISIERT', meldung);
  }

  static keineBerechtigung(meldung: string): ApiError {
    return new ApiError(403, 'KEINE_BERECHTIGUNG', meldung);
  }

  static nichtGefunden(meldung = 'Die angeforderte Bewerbung existiert nicht.'): ApiError {
    return new ApiError(404, 'NICHT_GEFUNDEN', meldung);
  }

  static konflikt(meldung: string): ApiError {
    return new ApiError(409, 'OFFENE_BEWERBUNG_VORHANDEN', meldung);
  }
}
