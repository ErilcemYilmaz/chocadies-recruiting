import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiFehler, bewerbungApi } from '../api/client';
import { fehlertext } from '../api/fehlertext';
import type { Bewerbung } from '../api/typen';
import { anzeigename } from '../i18n/anzeigenamen';
import { useSprache } from '../i18n/SprachKontext';
import { Bestaetigungsdialog } from '../komponenten/Bestaetigungsdialog';
import { Layout } from '../komponenten/Layout';
import { Meldung } from '../komponenten/Meldung';
import { StatusBadge } from '../komponenten/StatusBadge';

/** S3 Bewerbungsdetail mit S6 Loeschdialog. */
export function Bewerbungsdetail() {
  const { id = '' } = useParams();
  const { t, sprache, datum } = useSprache();
  const d = t.detail;
  const navigate = useNavigate();
  const location = useLocation();
  const [bewerbung, setBewerbung] = useState<Bewerbung | null>(null);
  const [fehler, setFehler] = useState<'nicht_gefunden' | string | null>(null);
  const [dialogOffen, setDialogOffen] = useState(false);
  const [loeschtGerade, setLoeschtGerade] = useState(false);
  const [loeschFehler, setLoeschFehler] = useState<string | undefined>();
  const [angelegt] = useState(() => (location.state as { meldung?: string } | null)?.meldung === 'angelegt');

  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
    // Nur beim ersten Rendern: Meldung aus der Navigation einmalig anzeigen.
  }, []);

  useEffect(() => {
    let aktuell = true;
    bewerbungApi
      .lesen(id)
      .then((b) => aktuell && setBewerbung(b))
      .catch((e) => {
        if (!aktuell) return;
        setFehler(e instanceof ApiFehler && (e.status === 404 || e.status === 400) ? 'nicht_gefunden' : fehlertext(e, t));
      });
    return () => {
      aktuell = false;
    };
  }, [id]);

  async function loeschen() {
    setLoeschtGerade(true);
    setLoeschFehler(undefined);
    try {
      await bewerbungApi.loeschen(id);
      navigate('/bewerbungen', { state: { meldung: 'geloescht' } });
    } catch (e) {
      setLoeschFehler(e instanceof ApiFehler && e.status !== 0 ? t.loeschdialog.fehler : fehlertext(e, t));
      setLoeschtGerade(false);
    }
  }

  const name = bewerbung ? `${bewerbung.vorname} ${bewerbung.nachname}` : '';
  const leer = t.allgemein.keineAngabe;

  if (fehler || !bewerbung) {
    return (
      <Layout mobilTitel={t.liste.titel}>
        {fehler === 'nicht_gefunden' ? (
          <div className="karte leerzustand">
            <p>{d.nichtGefunden}</p>
            <Link to="/bewerbungen" className="link">
              {d.zurListe}
            </Link>
          </div>
        ) : fehler ? (
          <Meldung art="fehler">{fehler}</Meldung>
        ) : (
          <p className="leerzustand" role="status">
            {t.allgemein.laden}
          </p>
        )}
      </Layout>
    );
  }

  return (
    <Layout mobilTitel={name}>
      {angelegt && (
        <Meldung art="erfolg" className="meldung--oben">
          {d.angelegt}
        </Meldung>
      )}

      <nav aria-label={d.brotkrumen} className="brotkrumen">
        <ol>
          <li>
            <Link to="/bewerbungen">{t.liste.titel}</Link>
          </li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>

      <div className="seitenkopf seitenkopf--detail">
        <div className="seitenkopf__titelzeile">
          <h1 className="seitenkopf__titel">{name}</h1>
          <StatusBadge status={bewerbung.status} />
        </div>
        <div className="seitenkopf__aktionen">
          <button type="button" className="knopf knopf--gefahr-rahmen" onClick={() => setDialogOffen(true)}>
            {d.loeschen}
          </button>
          <Link to={`/bewerbungen/${bewerbung.id}/bearbeiten`} className="knopf knopf--primaer">
            {d.bearbeiten}
          </Link>
        </div>
      </div>

      <div className="detailraster">
        <section className="karte" aria-labelledby="karte-personalien">
          <h2 id="karte-personalien" className="karte__titel">
            {d.personalien}
          </h2>
          <dl className="angaben">
            <div>
              <dt>{d.email}</dt>
              <dd>
                <a href={`mailto:${bewerbung.email}`} className="link link--still">
                  {bewerbung.email}
                </a>
              </dd>
            </div>
            <div>
              <dt>{d.telefon}</dt>
              <dd>{bewerbung.telefon ?? leer}</dd>
            </div>
            <div>
              <dt>{d.sprache}</dt>
              <dd>{bewerbung.sprache ? anzeigename.sprache(bewerbung.sprache, sprache) : leer}</dd>
            </div>
          </dl>
        </section>

        <section className="karte" aria-labelledby="karte-stelle">
          <h2 id="karte-stelle" className="karte__titel">
            {d.stelleKarte}
          </h2>
          <dl className="angaben angaben--zweispaltig">
            <div>
              <dt>{d.stelle}</dt>
              <dd>{bewerbung.stelle}</dd>
            </div>
            <div>
              <dt>{d.standort}</dt>
              <dd>{anzeigename.standort(bewerbung.standort, sprache)}</dd>
            </div>
            <div className="angaben__ganz">
              <dt>{d.quelle}</dt>
              <dd>{bewerbung.quelle ? anzeigename.quelle(bewerbung.quelle, sprache) : leer}</dd>
            </div>
            <div>
              <dt>{d.eingangsdatum}</dt>
              <dd>{datum(bewerbung.eingangsdatum)}</dd>
            </div>
            <div>
              <dt>{d.zuletztGeaendert}</dt>
              <dd>{datum(bewerbung.aenderungsdatum)}</dd>
            </div>
          </dl>
        </section>

        <section className="karte" aria-labelledby="karte-dokumente">
          <h2 id="karte-dokumente" className="karte__titel">
            {d.dokumente}
          </h2>
          {bewerbung.dokumente && bewerbung.dokumente.length > 0 ? (
            <table className="tabelle tabelle--klein">
              <thead>
                <tr>
                  <th scope="col">{d.typ}</th>
                  <th scope="col">{d.dateiname}</th>
                </tr>
              </thead>
              <tbody>
                {bewerbung.dokumente.map((dokument, index) => (
                  <tr key={`${dokument.dateiname}-${index}`}>
                    <td>{anzeigename.dokumenttyp(dokument.typ, sprache)}</td>
                    <td>
                      <a href={dokument.url} className="link" target="_blank" rel="noopener noreferrer">
                        {dokument.dateiname}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gedaempft">{d.keineDokumente}</p>
          )}
        </section>

        <section className="karte" aria-labelledby="karte-bemerkung">
          <h2 id="karte-bemerkung" className="karte__titel">
            {d.bemerkung}
          </h2>
          {bewerbung.bemerkung ? (
            <p className="bemerkung">{bewerbung.bemerkung}</p>
          ) : (
            <p className="text-gedaempft">{d.keineBemerkung}</p>
          )}
        </section>
      </div>

      {dialogOffen && (
        <Bestaetigungsdialog
          titel={t.loeschdialog.titel}
          text={t.loeschdialog.text(name)}
          abbrechenText={t.loeschdialog.abbrechen}
          bestaetigenText={t.loeschdialog.bestaetigen}
          beschaeftigt={loeschtGerade}
          fehler={loeschFehler}
          beiAbbrechen={() => {
            setDialogOffen(false);
            setLoeschFehler(undefined);
          }}
          beiBestaetigen={loeschen}
        />
      )}
    </Layout>
  );
}
