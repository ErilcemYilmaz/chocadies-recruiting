import { useEffect, useId, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { bewerbungApi } from '../api/client';
import { fehlertext } from '../api/fehlertext';
import { STANDORT_WERTE, STATUS_WERTE, type Bewerbungsliste as Liste, type Bewerbungsstatus, type Standort } from '../api/typen';
import { anzeigename } from '../i18n/anzeigenamen';
import { useSprache } from '../i18n/SprachKontext';
import { IconFilter } from '../komponenten/Icons';
import { Layout } from '../komponenten/Layout';
import { Meldung } from '../komponenten/Meldung';
import { StatusBadge } from '../komponenten/StatusBadge';

const PRO_SEITE = 20;
const SUCHE_VERZOEGERUNG_MS = 300;

/**
 * S2 Bewerbungen. Filter und Seite stehen in der URL (?suche=&status=&standort=&seite=),
 * damit "Zurueck" aus dem Detail wieder dieselbe Ansicht zeigt.
 * Unter 768 px: Filter hinter der Schaltflaeche "Filter", Karten statt Tabelle.
 */
export function Bewerbungsliste() {
  const { t, sprache, datum } = useSprache();
  const l = t.liste;
  const location = useLocation();
  const navigate = useNavigate();
  const [parameter, setParameter] = useSearchParams();
  const filterId = useId();

  const suchbegriff = parameter.get('suche') ?? '';
  const status = (parameter.get('status') ?? '') as Bewerbungsstatus | '';
  const standort = (parameter.get('standort') ?? '') as Standort | '';
  const seite = Math.max(1, Number(parameter.get('seite')) || 1);

  const [suchtext, setSuchtext] = useState(suchbegriff);
  const [liste, setListe] = useState<Liste | null>(null);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [filterOffen, setFilterOffen] = useState(false);
  const [meldung] = useState<string | null>(() =>
    (location.state as { meldung?: string } | null)?.meldung === 'geloescht' ? 'geloescht' : null,
  );

  // Einmalige Meldung aus der Navigation (z.B. nach dem Loeschen) aus dem Verlauf entfernen.
  useEffect(() => {
    if (location.state) navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, []);

  function aendereFilter(aenderungen: Record<string, string>) {
    const neu = new URLSearchParams(parameter);
    for (const [schluessel, wert] of Object.entries(aenderungen)) {
      if (wert) neu.set(schluessel, wert);
      else neu.delete(schluessel);
    }
    if (!('seite' in aenderungen)) neu.delete('seite');
    setParameter(neu);
  }

  // Suche erst nach einer kurzen Tipppause an die API schicken.
  useEffect(() => {
    if (suchtext === suchbegriff) return;
    const timer = setTimeout(() => aendereFilter({ suche: suchtext.trim() }), SUCHE_VERZOEGERUNG_MS);
    return () => clearTimeout(timer);
  }, [suchtext]);

  useEffect(() => {
    let aktuell = true;
    setLaedt(true);
    setFehler(null);
    bewerbungApi
      .suchen({
        suchbegriff: suchbegriff || undefined,
        status: status || undefined,
        standort: standort || undefined,
        seite,
        proSeite: PRO_SEITE,
      })
      .then((ergebnis) => aktuell && setListe(ergebnis))
      .catch((e) => aktuell && setFehler(fehlertext(e, t)))
      .finally(() => aktuell && setLaedt(false));
    return () => {
      aktuell = false;
    };
    // t bewusst nicht als Abhaengigkeit: Sprachwechsel laedt keine Daten neu.
  }, [suchbegriff, status, standort, seite]);

  const seiten = liste ? Math.max(1, Math.ceil(liste.gesamt / liste.proSeite)) : 1;
  const aktiveFilter = [suchbegriff, status, standort].filter(Boolean).length;
  const name = (b: { vorname: string; nachname: string }) => `${b.vorname} ${b.nachname}`;

  return (
    <Layout mobilTitel={l.titel}>
      {meldung && (
        <Meldung art="erfolg" className="meldung--oben">
          {l.geloescht}
        </Meldung>
      )}

      <div className="seitenkopf">
        <div>
          <h1 className="seitenkopf__titel">{l.titel}</h1>
          <p className="seitenkopf__untertitel">{l.untertitel}</p>
        </div>
        <Link to="/bewerbungen/neu" className="knopf knopf--primaer nur-desktop">
          {l.neueBewerbung}
        </Link>
      </div>

      <button
        type="button"
        className="filterknopf nur-mobil"
        aria-expanded={filterOffen}
        aria-controls={filterId}
        // Sichtbar "Filter 2", vorgelesen "Filter (2 Filter aktiv)" (WCAG 2.5.3: sichtbarer Text im Namen).
        aria-label={aktiveFilter > 0 ? `${l.filter} (${l.filterAktiv(aktiveFilter)})` : undefined}
        onClick={() => setFilterOffen((offen) => !offen)}
      >
        <IconFilter />
        <span>{l.filter}</span>
        {aktiveFilter > 0 && <span className="zaehler">{aktiveFilter}</span>}
      </button>

      <section id={filterId} className={`karte filter${filterOffen ? ' filter--offen' : ''}`} aria-label={l.filterBereich}>
        <div className="feld filter__suche">
          <label htmlFor="filter-suche" className="feld__label">
            {l.suche}
          </label>
          <input
            id="filter-suche"
            type="search"
            className="eingabe"
            placeholder={l.suchePlatzhalter}
            value={suchtext}
            onChange={(e) => setSuchtext(e.target.value)}
          />
        </div>
        <div className="feld">
          <label htmlFor="filter-status" className="feld__label feld__label--klein">
            {l.status}
          </label>
          <div className="auswahl">
            <select id="filter-status" value={status} onChange={(e) => aendereFilter({ status: e.target.value })}>
              <option value="">{l.alleStatus}</option>
              {STATUS_WERTE.map((wert) => (
                <option key={wert} value={wert}>
                  {anzeigename.status(wert, sprache)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="feld">
          <label htmlFor="filter-standort" className="feld__label feld__label--klein">
            {l.standort}
          </label>
          <div className="auswahl">
            <select id="filter-standort" value={standort} onChange={(e) => aendereFilter({ standort: e.target.value })}>
              <option value="">{l.alleStandorte}</option>
              {STANDORT_WERTE.map((wert) => (
                <option key={wert} value={wert}>
                  {anzeigename.standort(wert, sprache)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          className="text-knopf filter__zuruecksetzen"
          onClick={() => {
            setSuchtext('');
            setParameter(new URLSearchParams());
          }}
        >
          {l.filterZuruecksetzen}
        </button>
      </section>

      {fehler && <Meldung art="fehler">{fehler}</Meldung>}

      <section className="karte karte--tabelle" aria-busy={laedt}>
        {laedt && !liste ? (
          <p className="leerzustand" role="status">
            {l.laden}
          </p>
        ) : liste && liste.treffer.length === 0 ? (
          <p className="leerzustand" role="status">
            {l.leer}
          </p>
        ) : (
          liste && (
            <>
              <table className="tabelle nur-desktop">
                <caption className="visuell-versteckt">{l.tabelleBeschriftung}</caption>
                <thead>
                  <tr>
                    <th scope="col">{l.spalteName}</th>
                    <th scope="col">{l.spalteStelle}</th>
                    <th scope="col">{l.spalteStandort}</th>
                    <th scope="col">{l.spalteStatus}</th>
                    <th scope="col">{l.spalteEingang}</th>
                    <th scope="col" className="tabelle__aktionen">
                      {l.spalteAktionen}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {liste.treffer.map((b) => (
                    <tr key={b.id}>
                      <td className="tabelle__name">{name(b)}</td>
                      <td>{b.stelle}</td>
                      <td>{anzeigename.standort(b.standort, sprache)}</td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td>{datum(b.eingangsdatum)}</td>
                      <td className="tabelle__aktionen">
                        <Link to={`/bewerbungen/${b.id}`} className="link" aria-label={l.detailsVon(name(b))}>
                          {l.details}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="kartenliste nur-mobil" aria-label={l.tabelleBeschriftung}>
                {liste.treffer.map((b) => (
                  <li key={b.id} className="bewerbungskarte">
                    <h2 className="bewerbungskarte__name">{name(b)}</h2>
                    <p className="bewerbungskarte__stelle">
                      {b.stelle} • {anzeigename.standort(b.standort, sprache)}
                    </p>
                    <div className="bewerbungskarte__zeile">
                      <StatusBadge status={b.status} />
                      <span className="bewerbungskarte__eingang">{l.eingang(datum(b.eingangsdatum))}</span>
                    </div>
                    <Link to={`/bewerbungen/${b.id}`} className="bewerbungskarte__link">
                      {l.detailsAnzeigen}
                    </Link>
                  </li>
                ))}
              </ul>

              <nav className="seitenfuss" aria-label={l.seitennavigation}>
                <span className="seitenfuss__anzahl">{l.anzahl(liste.gesamt)}</span>
                <div className="seitenfuss__blaettern">
                  <span aria-live="polite">{l.seiteVon(seite, seiten)}</span>
                  <button
                    type="button"
                    className="knopf knopf--sekundaer"
                    disabled={seite <= 1}
                    onClick={() => aendereFilter({ seite: String(seite - 1) })}
                  >
                    {t.allgemein.zurueck}
                  </button>
                  <button
                    type="button"
                    className="knopf knopf--sekundaer"
                    disabled={seite >= seiten}
                    onClick={() => aendereFilter({ seite: String(seite + 1) })}
                  >
                    {t.allgemein.weiter}
                  </button>
                </div>
              </nav>
            </>
          )
        )}
      </section>
    </Layout>
  );
}
