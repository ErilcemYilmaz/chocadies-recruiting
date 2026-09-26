import { FilterQuery, isValidObjectId } from 'mongoose';
import {
  BewerbungModel,
  IBewerbung,
  Bewerbungsstatus,
  IStatusEintrag,
  Standort,
} from '../models/Bewerbung.model.js';
import { suchbegriffFilter } from './suchfilter.js';

/**
 * Data-Access-Layer fuer das Datenobjekt Bewerbung (siehe Komponentendiagramm,
 * Data-Access-Layer -> Bewerbungs-Repository). Kapselt sämtlichen
 * Mongoose-/MongoDB-Zugriff, damit die Domaenenschicht (Bewerbungsdienst)
 * keine Kenntnis der Persistenztechnologie braucht (Interface IPersistenz).
 */

export interface SucheOptionen {
  suchbegriff?: string;
  status?: Bewerbungsstatus;
  standort?: Standort;
  seite?: number;
  proSeite?: number;
  /** Schraenkt die Suche auf Bewerbungen einer bestimmten Personalvermittlungsfirma ein. */
  vermittlerId?: string;
}

export interface Seitenergebnis<T> {
  treffer: T[];
  seite: number;
  proSeite: number;
  gesamt: number;
}

export class BewerbungRepository {
  async anlegen(daten: Partial<IBewerbung>): Promise<IBewerbung> {
    const bewerbung = new BewerbungModel(daten);
    return bewerbung.save();
  }

  async findenNachId(id: string): Promise<IBewerbung | null> {
    if (!isValidObjectId(id)) return null;
    return BewerbungModel.findById(id).exec();
  }

  async suchen(optionen: SucheOptionen): Promise<Seitenergebnis<IBewerbung>> {
    const seite = optionen.seite ?? 1;
    const proSeite = optionen.proSeite ?? 20;
    const filter: FilterQuery<IBewerbung> = {};

    if (optionen.status) filter.status = optionen.status;
    if (optionen.standort) filter.standort = optionen.standort;
    if (optionen.suchbegriff) Object.assign(filter, suchbegriffFilter(optionen.suchbegriff));
    if (optionen.vermittlerId) filter.vermittlerId = optionen.vermittlerId;

    const [treffer, gesamt] = await Promise.all([
      BewerbungModel.find(filter)
        .skip((seite - 1) * proSeite)
        .limit(proSeite)
        .sort({ eingangsdatum: -1 })
        .exec(),
      BewerbungModel.countDocuments(filter).exec(),
    ]);

    return { treffer, seite, proSeite, gesamt };
  }

  /**
   * statuswechsel wird, falls angegeben, an den Statusverlauf angehaengt.
   * entfernen nennt optionale Felder, die geloescht werden sollen ($unset).
   */
  async aendern(
    id: string,
    daten: Partial<IBewerbung>,
    statuswechsel?: IStatusEintrag,
    entfernen: (keyof IBewerbung)[] = [],
  ): Promise<IBewerbung | null> {
    if (!isValidObjectId(id)) return null;
    const update: Record<string, unknown> = { ...daten };
    if (statuswechsel) update.$push = { statusverlauf: statuswechsel };
    if (entfernen.length > 0) update.$unset = Object.fromEntries(entfernen.map((feld) => [feld, 1]));
    return BewerbungModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      context: 'query',
    }).exec();
  }

  async loeschen(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const ergebnis = await BewerbungModel.findByIdAndDelete(id).exec();
    return ergebnis !== null;
  }

  /** Fuer die 409-Antwort aus der OpenAPI-Spezifikation (POST /bewerbungen). */
  async offeneBewerbungExistiert(email: string, stelle: string): Promise<boolean> {
    const offeneStati: Bewerbungsstatus[] = ['eingegangen', 'in_pruefung', 'zum_gespraech_eingeladen'];
    const treffer = await BewerbungModel.exists({
      email: email.toLowerCase(),
      stelle,
      status: { $in: offeneStati },
    });
    return treffer !== null;
  }
}

export const bewerbungRepository = new BewerbungRepository();
