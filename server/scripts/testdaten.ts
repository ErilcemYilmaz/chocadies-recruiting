import { connectDb, disconnectDb } from '../src/config/db.js';
import { BewerbungModel, IBewerbung } from '../src/models/Bewerbung.model.js';
import { bewerbungRepository } from '../src/repositories/bewerbung.repository.js';

/**
 * Fiktive Testdaten fuer den manuellen Systemtest (Kapitel 4.4.3,
 * tests/systemtest-4.4.3.md).
 *
 *   npm run testdaten:anlegen    entfernt alte Testdaten und legt 24 neue an
 *   npm run testdaten:entfernen  entfernt alle Testdaten
 *
 * Alle Testdatensaetze tragen E-Mail-Adressen der reservierten Domain
 * "testdaten.example" (RFC 2606). Daran erkennt "entfernen" sie; echte
 * Bewerbungen werden nie beruehrt. Die Personen sind frei erfunden.
 */

const DOMAIN = 'testdaten.example';
const TAG_MS = 24 * 60 * 60 * 1000;

type Eintrag = [
  vorname: string,
  nachname: string,
  stelle: string,
  standort: IBewerbung['standort'],
  status: IBewerbung['status'],
  sprache: IBewerbung['sprache'],
  vorTagen: number,
  extras?: Partial<IBewerbung>,
];

// 24 Eintraege: mehr als eine Seite (20 pro Seite), alle Status, alle
// Standorte, beide Sprachen, mit und ohne Telefon, Dokumente, Quelle.
const EINTRAEGE: Eintrag[] = [
  ['Sophie', 'Meier', 'Verkaufsleiterin', 'lenzburg', 'eingegangen', 'de', 1, { telefon: '+41 79 123 45 67', quelle: 'webshop' }],
  ['Jean-Pierre', 'Dubois', 'Filialleiter', 'nancy', 'in_pruefung', 'fr', 3, { quelle: 'linkedin' }],
  ['Claudine', 'Rochat', 'Konditorin', 'filiale_ch', 'zum_gespraech_eingeladen', 'fr', 5, { telefon: '+41 78 555 12 34' }],
  ['Marcel', 'Fontaine', 'Bäcker', 'filiale_fr', 'abgelehnt', 'fr', 8],
  ['Lisa', 'Brunner', 'HR Assistentin', 'lenzburg', 'eingestellt', 'de', 12, { quelle: 'webshop' }],
  ['François', 'Leroy', 'Logistiker', 'store_international', 'eingegangen', 'fr', 14],
  ['Nadine', 'Schwarz', 'Verkäuferin', 'filiale_ch', 'in_pruefung', 'de', 15, { quelle: 'mobile_app' }],
  ['Pierre', 'Moreau', 'Chocolatier', 'nancy', 'zum_gespraech_eingeladen', 'fr', 17],
  ['Anna', 'Keller', 'Chocolatier/in Produktion Lenzburg', 'lenzburg', 'eingegangen', 'de', 18, { telefon: '+41 62 888 77 66' }],
  ['Luca', 'Bernasconi', 'Qualitätsmanager', 'lenzburg', 'in_pruefung', 'de', 20, { quelle: 'linkedin' }],
  ['Camille', 'Girard', 'Vendeuse', 'filiale_fr', 'eingegangen', 'fr', 22],
  ['Thomas', 'Huber', 'Lagerist', 'lenzburg', 'abgelehnt', 'de', 24],
  ['Elena', 'Rossi', 'Confiseurin', 'filiale_ch', 'zum_gespraech_eingeladen', 'de', 26, { quelle: 'personalvermittlung', vermittlerId: 'firma-a' }],
  ['Julien', 'Mercier', 'Chocolatier', 'nancy', 'eingegangen', 'fr', 28],
  ['Sarah', 'Frei', 'Marketing Managerin', 'lenzburg', 'in_pruefung', 'de', 30, { telefon: '+41 76 222 33 44', quelle: 'linkedin' }],
  ['David', 'Zimmermann', 'Informatiker', 'lenzburg', 'eingestellt', 'de', 33],
  ['Chloé', 'Lambert', 'Store Managerin', 'store_international', 'zum_gespraech_eingeladen', 'fr', 35],
  ['Marco', 'Weber', 'Verkäufer', 'filiale_ch', 'eingegangen', 'de', 37, { quelle: 'webshop' }],
  ['Isabelle', 'Fournier', 'Comptable', 'nancy', 'abgelehnt', 'fr', 40],
  ['Reto', 'Baumann', 'Maschinenführer', 'lenzburg', 'in_pruefung', 'de', 43, { quelle: 'personalvermittlung', vermittlerId: 'firma-a' }],
  ['Manon', 'Petit', 'Vendeuse', 'filiale_fr', 'eingegangen', 'fr', 45],
  ['Simon', 'Graf', 'Logistiker', 'lenzburg', 'eingegangen', 'de', 48],
  ['Laura', 'Steiner', 'Confiseurin', 'filiale_ch', 'eingestellt', 'de', 52, { telefon: '+41 79 987 65 43' }],
  ['Hugo', 'Chevalier', 'Chocolatier', 'store_international', 'in_pruefung', 'fr', 55, { quelle: 'mobile_app' }],
];

async function entfernen(): Promise<number> {
  // Bewusst direkt ueber das Modell: Der Data-Access-Layer bietet (zu Recht)
  // kein Massenloeschen an, und das Skript ist kein Teil der Web-API.
  const ergebnis = await BewerbungModel.deleteMany({ email: { $regex: `@${DOMAIN.replace('.', '\\.')}$` } });
  return ergebnis.deletedCount;
}

async function anlegen(): Promise<number> {
  const jetzt = Date.now();
  for (const [vorname, nachname, stelle, standort, status, sprache, vorTagen, extras = {}] of EINTRAEGE) {
    const eingangsdatum = new Date(jetzt - vorTagen * TAG_MS);
    // Akzente fuer die Adresse entfernen (François -> francois).
    const email = `${vorname}.${nachname}@${DOMAIN}`
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    await bewerbungRepository.anlegen({
      vorname,
      nachname,
      email,
      stelle,
      standort,
      sprache,
      status,
      eingangsdatum,
      dokumente: [
        { dateiname: `Lebenslauf_${nachname}.pdf`, typ: 'lebenslauf', url: `https://dokumente.chocadies.ch/bewerbungen/Lebenslauf_${nachname}.pdf` },
      ],
      statusverlauf: [{ status, zeitpunkt: eingangsdatum, geaendertVon: 'skript:testdaten' }],
      ...extras,
    });
  }
  return EINTRAEGE.length;
}

async function main() {
  const modus = process.argv[2];
  if (modus !== 'anlegen' && modus !== 'entfernen') {
    console.error('Aufruf: tsx scripts/testdaten.ts anlegen|entfernen');
    process.exit(2);
  }

  await connectDb();
  const entfernt = await entfernen();
  console.log(`[Testdaten] ${entfernt} vorhandene Testdatensaetze entfernt.`);
  if (modus === 'anlegen') {
    console.log(`[Testdaten] ${await anlegen()} Testdatensaetze angelegt (Domain ${DOMAIN}).`);
  }
  await disconnectDb();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Testdaten] Fehlgeschlagen:', err);
  process.exit(1);
});
