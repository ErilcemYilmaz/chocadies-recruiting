/**
 * Einheitliche Fehlerklasse fuer die Web-API. Wird vom zentralen
 * Error-Handler (middleware/errorHandler.ts) in das Fehler-Schema aus
 * api/openapi.yaml (components/schemas/Fehler) uebersetzt.
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

  static ungueltigeAnfrage(meldung: string, details?: FehlerDetail[]): ApiError {
    return new ApiError(400, 'VALIDIERUNG_FEHLGESCHLAGEN', meldung, details);
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
