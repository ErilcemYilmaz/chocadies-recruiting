import { useId, useState, type ChangeEvent, type DragEvent } from 'react';
import { DOKUMENTTYP_WERTE, type Dokument, type Dokumenttyp } from '../../api/typen';
import { anzeigename } from '../../i18n/anzeigenamen';
import { useSprache } from '../../i18n/SprachKontext';
import { IconMuelleimer, IconUpload } from '../Icons';
import { MAX_DOKUMENTE } from './validierung';

/**
 * Ablageort fuer Dokumente. Die API speichert pro Dokument nur dateiname,
 * typ und url und bietet keinen Upload-Endpunkt (api/openapi.yaml, Schema
 * Dokument). Bis ein Dokumentenspeicher angebunden ist, erhalten neue
 * Dokumente eine URL unter dieser geplanten Adresse, die Datei selbst wird
 * nicht uebertragen (Abweichung, siehe Uebergabe 4.3).
 */
const DOKUMENT_ABLAGE = 'https://dokumente.chocadies.ch/bewerbungen/';

/** Typ aus dem Dateinamen vorschlagen, anpassbar ueber die Auswahlliste. */
function typVorschlag(dateiname: string): Dokumenttyp {
  if (/lebenslauf|\bcv\b|resume/i.test(dateiname)) return 'lebenslauf';
  if (/motivation/i.test(dateiname)) return 'motivationsschreiben';
  if (/zeugnis|certificat/i.test(dateiname)) return 'zeugnis';
  return 'sonstiges';
}

interface Props {
  dokumente: Dokument[];
  fehler?: string;
  beiAenderung: (dokumente: Dokument[]) => void;
}

export function DokumentAuswahl({ dokumente, fehler, beiAenderung }: Props) {
  const { t, sprache } = useSprache();
  const [ziehtDarueber, setZiehtDarueber] = useState(false);
  const eingabeId = useId();
  const fehlerId = `${eingabeId}-fehler`;
  const hinweisId = `${eingabeId}-hinweis`;

  function hinzufuegen(dateien: FileList | null) {
    if (!dateien) return;
    const neue = Array.from(dateien).map<Dokument>((datei) => ({
      dateiname: datei.name,
      typ: typVorschlag(datei.name),
      url: `${DOKUMENT_ABLAGE}${encodeURIComponent(datei.name)}`,
    }));
    // Validierung meldet ueberzaehlige Dateien, statt sie still zu verwerfen.
    beiAenderung([...dokumente, ...neue]);
  }

  function beiAuswahl(e: ChangeEvent<HTMLInputElement>) {
    hinzufuegen(e.target.files);
    e.target.value = '';
  }

  function beiAblegen(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setZiehtDarueber(false);
    hinzufuegen(e.dataTransfer.files);
  }

  function typAendern(index: number, typ: Dokumenttyp) {
    beiAenderung(dokumente.map((d, i) => (i === index ? { ...d, typ } : d)));
  }

  function entfernen(index: number) {
    beiAenderung(dokumente.filter((_, i) => i !== index));
  }

  return (
    <div className="dokumente">
      <label
        htmlFor={eingabeId}
        className={`ablagezone${ziehtDarueber ? ' ablagezone--aktiv' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setZiehtDarueber(true);
        }}
        onDragLeave={() => setZiehtDarueber(false)}
        onDrop={beiAblegen}
      >
        <IconUpload />
        <span>{t.formular.dateienZiehen}</span>
        <input
          id={eingabeId}
          type="file"
          multiple
          className="visuell-versteckt"
          onChange={beiAuswahl}
          aria-describedby={[hinweisId, fehler ? fehlerId : ''].filter(Boolean).join(' ')}
          aria-invalid={!!fehler}
        />
      </label>
      <p id={hinweisId} className="feld__hinweis">
        {t.formular.dateienHinweis}
      </p>
      {fehler && (
        <p id={fehlerId} className="feld__fehler">
          {fehler}
        </p>
      )}

      {dokumente.length > 0 && (
        <>
          <h3 className="dokumente__titel">{t.formular.hochgeladeneDateien}</h3>
          <ul className="dokumente__liste">
            {dokumente.map((dokument, index) => (
              <li key={`${dokument.dateiname}-${index}`} className="dokumente__eintrag">
                <span className="dokumente__name">{dokument.dateiname}</span>
                <div className="auswahl auswahl--klein">
                  <select
                    value={dokument.typ}
                    aria-label={t.formular.dokumenttypVon(dokument.dateiname)}
                    onChange={(e) => typAendern(index, e.target.value as Dokumenttyp)}
                  >
                    {DOKUMENTTYP_WERTE.map((typ) => (
                      <option key={typ} value={typ}>
                        {anzeigename.dokumenttyp(typ, sprache)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="icon-knopf icon-knopf--gefahr"
                  aria-label={t.formular.dateiEntfernen(dokument.dateiname)}
                  onClick={() => entfernen(index)}
                >
                  <IconMuelleimer />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <span className="visuell-versteckt" aria-live="polite">
        {dokumente.length > 0 ? `${dokumente.length} / ${MAX_DOKUMENTE}` : ''}
      </span>
    </div>
  );
}
