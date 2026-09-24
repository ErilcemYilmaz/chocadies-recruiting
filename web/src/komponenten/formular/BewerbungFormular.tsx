import { useEffect, useRef, useState, type FormEvent } from 'react';
import { STANDORT_WERTE, STATUS_WERTE, SPRACH_WERTE, type Bewerbungsstatus, type Sprache, type Standort } from '../../api/typen';
import { anzeigename } from '../../i18n/anzeigenamen';
import { useSprache } from '../../i18n/SprachKontext';
import { Feld } from '../Feld';
import { DokumentAuswahl } from './DokumentAuswahl';
import { pruefeAlle, pruefeFeld, type Feldfehler, type Feldname, type Formularwerte } from './validierung';

interface Props {
  modus: 'neu' | 'bearbeiten';
  anfangswerte: Formularwerte;
  /** Nur beim Bearbeiten: Datum fuer "Zuletzt geaendert am". */
  zuletztGeaendert?: string;
  /** Vom Server gemeldete Feldfehler (400 mit details). */
  serverFehler?: Feldfehler;
  speichertGerade: boolean;
  beiSpeichern: (werte: Formularwerte) => void;
  beiAbbrechen: () => void;
  /** Jede Eingabe, z.B. um die Erfolgsmeldung auszublenden. */
  beiEingabe?: () => void;
}

/**
 * Gemeinsames Formular fuer S4 (Neue Bewerbung) und S5 (Bearbeiten). Aufbau
 * und Feldreihenfolge nach Wireframe: links "Bearbeitungsstand" (nur S5),
 * "1. Personalien", "2. Bewerbungsdetails", rechts "3. Dokumente & Bemerkung".
 */
export function BewerbungFormular({
  modus,
  anfangswerte,
  zuletztGeaendert,
  serverFehler,
  speichertGerade,
  beiSpeichern,
  beiAbbrechen,
  beiEingabe,
}: Props) {
  const { t, sprache, datum } = useSprache();
  const f = t.formular;
  const [werte, setWerte] = useState<Formularwerte>(anfangswerte);
  const [fehler, setFehler] = useState<Feldfehler>({});
  const formular = useRef<HTMLFormElement>(null);

  useEffect(() => setWerte(anfangswerte), [anfangswerte]);
  useEffect(() => {
    if (serverFehler && Object.keys(serverFehler).length > 0) {
      setFehler((bisher) => ({ ...bisher, ...serverFehler }));
    }
  }, [serverFehler]);

  // Fehlertexte bei Sprachwechsel in der neuen Sprache neu berechnen.
  useEffect(() => {
    setFehler((bisher) => {
      const neu: Feldfehler = {};
      for (const feld of Object.keys(bisher) as Feldname[]) {
        neu[feld] = pruefeFeld(feld, werte, t) ?? bisher[feld];
      }
      return neu;
    });
    // Bewusst nur bei Sprachwechsel, nicht bei jeder Eingabe.
  }, [t]);

  function setze<K extends Feldname>(feld: K, wert: Formularwerte[K]) {
    const neu = { ...werte, [feld]: wert };
    setWerte(neu);
    beiEingabe?.();
    // Ein bereits angezeigter Fehler verschwindet, sobald die Eingabe stimmt.
    if (fehler[feld]) setFehler((bisher) => ({ ...bisher, [feld]: pruefeFeld(feld, neu, t) }));
  }

  function beimVerlassen(feld: Feldname) {
    // Leere Pflichtfelder erst beim Speichern melden, nicht schon beim Durchtabben.
    const wert = werte[feld];
    if (typeof wert === 'string' && !wert.trim()) return;
    setFehler((bisher) => ({ ...bisher, [feld]: pruefeFeld(feld, werte, t) }));
  }

  function absenden(e: FormEvent) {
    e.preventDefault();
    const neu = pruefeAlle(werte, t);
    setFehler(neu);
    if (Object.keys(neu).length > 0) {
      // Fokus auf das erste fehlerhafte Feld (in Dokumentreihenfolge).
      requestAnimationFrame(() => formular.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    beiSpeichern(werte);
  }

  const textfeld = (feld: 'nachname' | 'vorname' | 'email' | 'telefon' | 'stelle', label: string, platzhalter: string, pflicht: boolean, typ = 'text') => (
    <Feld label={label} pflicht={pflicht} fehler={fehler[feld]}>
      {(steuerung) => (
        <input
          {...steuerung}
          type={typ}
          className="eingabe"
          value={werte[feld]}
          placeholder={platzhalter}
          autoComplete={feld === 'email' ? 'email' : feld === 'telefon' ? 'tel' : 'off'}
          onChange={(e) => setze(feld, e.target.value)}
          onBlur={() => beimVerlassen(feld)}
        />
      )}
    </Feld>
  );

  return (
    <form ref={formular} className="formular" onSubmit={absenden} noValidate>
      <div className="formular__raster">
        <div className="formular__spalte">
          {modus === 'bearbeiten' && (
            <section className="karte" aria-labelledby="karte-stand">
              <h2 id="karte-stand" className="karte__titel">
                {f.bearbeitungsstand}
              </h2>
              <Feld label={f.status} pflicht hinweis={zuletztGeaendert ? f.zuletztGeaendertAm(datum(zuletztGeaendert)) : undefined}>
                {(steuerung) => (
                  <div className="auswahl">
                    <select
                      {...steuerung}
                      value={werte.status}
                      onChange={(e) => setze('status', e.target.value as Bewerbungsstatus)}
                    >
                      {STATUS_WERTE.map((status) => (
                        <option key={status} value={status}>
                          {anzeigename.status(status, sprache)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </Feld>
            </section>
          )}

          <section className="karte" aria-labelledby="karte-personalien">
            <h2 id="karte-personalien" className="karte__titel">
              {f.personalien}
            </h2>
            <div className="feldreihe">
              {textfeld('nachname', f.nachname, f.nachnamePlatzhalter, true)}
              {textfeld('vorname', f.vorname, f.vornamePlatzhalter, true)}
            </div>
            {textfeld('email', f.email, f.emailPlatzhalter, true, 'email')}
            {textfeld('telefon', f.telefon, f.telefonPlatzhalter, false, 'tel')}
          </section>

          <section className="karte" aria-labelledby="karte-details">
            <h2 id="karte-details" className="karte__titel">
              {f.bewerbungsdetails}
            </h2>
            <div className="feldreihe">
              {textfeld('stelle', f.stelle, f.stellePlatzhalter, true)}
              <Feld label={f.standort} pflicht fehler={fehler.standort}>
                {(steuerung) => (
                  <div className="auswahl">
                    <select
                      {...steuerung}
                      value={werte.standort}
                      className={werte.standort ? '' : 'auswahl--platzhalter'}
                      onChange={(e) => setze('standort', e.target.value as Standort)}
                      onBlur={() => beimVerlassen('standort')}
                    >
                      <option value="" disabled>
                        {f.standortPlatzhalter}
                      </option>
                      {STANDORT_WERTE.map((standort) => (
                        <option key={standort} value={standort}>
                          {anzeigename.standort(standort, sprache)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </Feld>
            </div>
            <fieldset className="feld optionsgruppe">
              <legend className="feld__label">{f.sprache}</legend>
              <div className="optionsgruppe__optionen">
                {SPRACH_WERTE.map((wert) => (
                  <label key={wert} className="option">
                    <input
                      type="radio"
                      name="sprache"
                      value={wert}
                      checked={werte.sprache === wert}
                      onChange={() => setze('sprache', wert as Sprache)}
                    />
                    {anzeigename.sprache(wert, sprache)}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        </div>

        <div className="formular__spalte">
          <section className="karte" aria-labelledby="karte-dokumente">
            <h2 id="karte-dokumente" className="karte__titel">
              {f.dokumenteUndBemerkung}
            </h2>
            <DokumentAuswahl
              dokumente={werte.dokumente}
              fehler={fehler.dokumente}
              beiAenderung={(dokumente) => {
                const neu = { ...werte, dokumente };
                setWerte(neu);
                beiEingabe?.();
                setFehler((bisher) => ({ ...bisher, dokumente: pruefeFeld('dokumente', neu, t) }));
              }}
            />
            <Feld label={f.bemerkung} fehler={fehler.bemerkung}>
              {(steuerung) => (
                <textarea
                  {...steuerung}
                  className="eingabe eingabe--mehrzeilig"
                  rows={4}
                  value={werte.bemerkung}
                  placeholder={f.bemerkungPlatzhalter}
                  onChange={(e) => setze('bemerkung', e.target.value)}
                  onBlur={() => beimVerlassen('bemerkung')}
                />
              )}
            </Feld>
          </section>
        </div>
      </div>

      <div className="formular__aktionen">
        <button type="button" className="knopf knopf--sekundaer" onClick={beiAbbrechen}>
          {f.abbrechen}
        </button>
        <button type="submit" className="knopf knopf--primaer" disabled={speichertGerade}>
          {speichertGerade ? f.speichernLaeuft : modus === 'neu' ? f.speichern : f.aenderungenSpeichern}
        </button>
      </div>
    </form>
  );
}
