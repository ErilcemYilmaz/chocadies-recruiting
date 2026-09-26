import { NextFunction, Request, Response } from 'express';
import { bewerbungRepository } from '../repositories/bewerbung.repository.js';
import { IBewerbung } from '../models/Bewerbung.model.js';
import { ApiError } from '../errors/ApiError.js';
import { BewerbungAenderung, BewerbungEingabe, SucheQuery } from '../schemas/bewerbung.schema.js';

/**
 * REST-Controller (Komponente CTRL, stellt Interface IBewerbungAPI bereit).
 * Setzt die fuenf Operationen aus api/openapi.yaml (Pfad /bewerbungen) um
 * und delegiert die eigentliche Persistenz an bewerbungRepository (REPO).
 * Enthaelt bewusst keine Mongoose-/MongoDB-spezifische Logik, siehe
 * Interface IPersistenz im Komponentendiagramm.
 */

// Nur die im OpenAPI-Schema "Bewerbung" definierten Felder nach aussen
// geben, insbesondere NIE das interne Feld vermittlerId.
function serialisieren(b: IBewerbung) {
  return {
    id: b.id,
    nachname: b.nachname,
    vorname: b.vorname,
    email: b.email,
    telefon: b.telefon,
    stelle: b.stelle,
    standort: b.standort,
    sprache: b.sprache,
    status: b.status,
    bemerkung: b.bemerkung,
    dokumente: b.dokumente,
    quelle: b.quelle,
    eingangsdatum: b.eingangsdatum,
    aenderungsdatum: b.aenderungsdatum,
  };
}

/** Optionale Freitextfelder, die per PUT ohne Wert entfernt werden. */
const OPTIONALE_FELDER = ['telefon', 'bemerkung'] as const;

/** Personalvermittlungsfirmen sehen ausschliesslich eigene Bewerbungen (openapi.yaml Z. 43-45). */
function pruefeZugriff(req: Request, bewerbung: IBewerbung): void {
  if (req.auth?.scope === 'personalvermittlung' && bewerbung.vermittlerId !== req.auth.firmaId) {
    // Bewusst 404 statt 403: openapi.yaml definiert fuer GET/PUT keinen
    // 403-Fall, nur fuer DELETE (siehe loeschen unten). 404 vermeidet
    // zudem, die Existenz fremder Bewerbungen zu bestaetigen.
    throw ApiError.nichtGefunden();
  }
}

export async function bewerbungenSuchen(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.query wurde bereits durch validate(SucheQuerySchema, 'query') geparst
    // und mit Defaults befuellt (siehe middleware/validate.ts).
    const query = req.query as unknown as SucheQuery;
    const vermittlerId = req.auth?.scope === 'personalvermittlung' ? req.auth.firmaId : undefined;

    const ergebnis = await bewerbungRepository.suchen({
      suchbegriff: query.suchbegriff,
      status: query.status,
      standort: query.standort,
      seite: query.seite,
      proSeite: query.proSeite,
      vermittlerId,
    });

    res.status(200).json({
      treffer: ergebnis.treffer.map(serialisieren),
      seite: ergebnis.seite,
      proSeite: ergebnis.proSeite,
      gesamt: ergebnis.gesamt,
    });
  } catch (err) {
    next(err);
  }
}

export async function bewerbungAnlegen(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.body wurde bereits durch validate(BewerbungEingabeSchema, 'body') geparst.
    const eingabe = req.body as BewerbungEingabe;

    const offenVorhanden = await bewerbungRepository.offeneBewerbungExistiert(eingabe.email, eingabe.stelle);
    if (offenVorhanden) {
      throw ApiError.konflikt('Fuer diese E-Mail-Adresse und Stelle besteht bereits eine offene Bewerbung.');
    }

    const istVermittler = req.auth?.scope === 'personalvermittlung';
    const neu = await bewerbungRepository.anlegen({
      ...eingabe,
      // Serverseitig gesetzt, siehe openapi.yaml Zeile 98f.: id, status,
      // eingangsdatum werden im Anfragekoerper ignoriert. quelle und
      // vermittlerId werden bei Personalvermittlungsfirmen zusaetzlich vom
      // Server anhand des Zugriffstokens gesetzt, nicht vom Aufrufer.
      quelle: istVermittler ? 'personalvermittlung' : undefined,
      vermittlerId: istVermittler ? req.auth?.firmaId : undefined,
      statusverlauf: [{ status: 'eingegangen', zeitpunkt: new Date(), geaendertVon: req.auth!.sub }],
    });

    res.status(201).location(`/bewerbungen/${neu.id}`).json(serialisieren(neu));
  } catch (err) {
    next(err);
  }
}

export async function bewerbungLesen(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bewerbung = await bewerbungRepository.findenNachId(req.params.bewerbungId);
    if (!bewerbung) throw ApiError.nichtGefunden();
    pruefeZugriff(req, bewerbung);

    res.status(200).json(serialisieren(bewerbung));
  } catch (err) {
    next(err);
  }
}

export async function bewerbungAendern(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bestehend = await bewerbungRepository.findenNachId(req.params.bewerbungId);
    if (!bestehend) throw ApiError.nichtGefunden();
    pruefeZugriff(req, bestehend);

    // req.body wurde bereits durch validate(BewerbungAenderungSchema, 'body') geparst.
    const eingabe = req.body as BewerbungAenderung;

    // Den Bearbeitungsstand fuehrt ausschliesslich die interne Personalabteilung.
    if (eingabe.status !== undefined && req.auth?.scope !== 'intern') {
      throw ApiError.keineBerechtigung('Nur interne Benutzende duerfen den Status aendern.');
    }

    const statuswechsel =
      eingabe.status !== undefined && eingabe.status !== bestehend.status
        ? { status: eingabe.status, zeitpunkt: new Date(), geaendertVon: req.auth!.sub }
        : undefined;

    // PUT ersetzt die aenderbaren Felder: Fehlt ein optionales Feld, wird es
    // entfernt statt stillschweigend beibehalten (Befund B-3 aus dem
    // Systemtest 4.4.3: Telefonnummer liess sich nicht loeschen).
    const entfernen = OPTIONALE_FELDER.filter((feld) => eingabe[feld] === undefined);

    const geaendert = await bewerbungRepository.aendern(req.params.bewerbungId, eingabe, statuswechsel, entfernen);
    if (!geaendert) throw ApiError.nichtGefunden();

    res.status(200).json(serialisieren(geaendert));
  } catch (err) {
    next(err);
  }
}

export async function bewerbungLoeschen(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bestehend = await bewerbungRepository.findenNachId(req.params.bewerbungId);
    if (!bestehend) throw ApiError.nichtGefunden();

    // Loeschen ist bewusst restriktiver als Lesen/Aendern: nur interne
    // Sachbearbeitende duerfen loeschen (openapi.yaml definiert dafuer
    // explizit einen 403-Fall, anders als bei GET/PUT).
    if (req.auth?.scope !== 'intern') {
      throw ApiError.keineBerechtigung('Nur interne Benutzende duerfen Bewerbungen loeschen.');
    }

    await bewerbungRepository.loeschen(req.params.bewerbungId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
