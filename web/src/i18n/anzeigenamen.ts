import type { Bewerbungsstatus, Dokumenttyp, Quelle, Sprache, Standort } from '../api/typen';

/**
 * Anzeigenamen der Enum-Werte aus api/openapi.yaml. Record<...> erzwingt
 * einen Namen je Wert und Sprache, sonst bricht der Build ab.
 */
type Namen<T extends string> = Record<T, Record<Sprache, string>>;

const STATUS: Namen<Bewerbungsstatus> = {
  eingegangen: { de: 'Eingegangen', fr: 'Reçue' },
  in_pruefung: { de: 'In Prüfung', fr: 'En examen' },
  zum_gespraech_eingeladen: { de: 'Zum Gespräch eingeladen', fr: 'Invitation à un entretien' },
  abgelehnt: { de: 'Abgelehnt', fr: 'Refusée' },
  eingestellt: { de: 'Eingestellt', fr: 'Embauche' },
};

const STANDORT: Namen<Standort> = {
  lenzburg: { de: 'Lenzburg', fr: 'Lenzburg' },
  nancy: { de: 'Nancy', fr: 'Nancy' },
  filiale_ch: { de: 'Filiale Schweiz', fr: 'Filiale Suisse' },
  filiale_fr: { de: 'Filiale Frankreich', fr: 'Filiale France' },
  store_international: { de: 'Store International', fr: 'Store International' },
};

const DOKUMENTTYP: Namen<Dokumenttyp> = {
  lebenslauf: { de: 'Lebenslauf', fr: 'Curriculum vitae' },
  motivationsschreiben: { de: 'Motivationsschreiben', fr: 'Lettre de motivation' },
  zeugnis: { de: 'Zeugnis', fr: 'Certificat' },
  sonstiges: { de: 'Sonstiges', fr: 'Autre' },
};

const QUELLE: Namen<Quelle> = {
  webshop: { de: 'Online-Bewerbung', fr: 'Candidature en ligne' },
  mobile_app: { de: 'Mobile App', fr: 'Application mobile' },
  linkedin: { de: 'LinkedIn', fr: 'LinkedIn' },
  personalvermittlung: { de: 'Personalvermittlung', fr: 'Agence de placement' },
};

const SPRACHE: Namen<Sprache> = {
  de: { de: 'Deutsch', fr: 'Allemand' },
  fr: { de: 'Französisch', fr: 'Français' },
};

export const anzeigename = {
  status: (wert: Bewerbungsstatus, sprache: Sprache) => STATUS[wert][sprache],
  standort: (wert: Standort, sprache: Sprache) => STANDORT[wert][sprache],
  dokumenttyp: (wert: Dokumenttyp, sprache: Sprache) => DOKUMENTTYP[wert][sprache],
  quelle: (wert: Quelle, sprache: Sprache) => QUELLE[wert][sprache],
  sprache: (wert: Sprache, sprache: Sprache) => SPRACHE[wert][sprache],
};
