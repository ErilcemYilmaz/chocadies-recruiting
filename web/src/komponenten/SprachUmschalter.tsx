import { SPRACH_WERTE } from '../api/typen';
import { useSprache } from '../i18n/SprachKontext';

/** DE | FR, verwendet auf der Anmeldung (S1) und in der Seitenleiste. */
export function SprachUmschalter({ hell = false }: { hell?: boolean }) {
  const { sprache, setzeSprache, t } = useSprache();

  return (
    <div className={`sprachumschalter${hell ? ' sprachumschalter--hell' : ''}`} role="group" aria-label={t.sprache.umschalterLabel}>
      {SPRACH_WERTE.map((wert, index) => {
        const kurz = wert === 'de' ? t.sprache.de : t.sprache.fr;
        const lang = wert === 'de' ? t.sprache.deLang : t.sprache.frLang;
        return (
        <span key={wert} className="sprachumschalter__eintrag">
          {index > 0 && (
            <span className="sprachumschalter__trenner" aria-hidden="true">
              |
            </span>
          )}
          <button
            type="button"
            className="sprachumschalter__knopf"
            aria-pressed={sprache === wert}
            // Sichtbarer Text muss im zugaenglichen Namen stehen (WCAG 2.5.3).
            aria-label={`${kurz}, ${lang}`}
            onClick={() => setzeSprache(wert)}
          >
            {kurz}
          </button>
        </span>
        );
      })}
    </div>
  );
}
