import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiFehler, bewerbungApi } from '../api/client';
import { fehlertext, serverFeldfehler } from '../api/fehlertext';
import type { Bewerbung } from '../api/typen';
import { useSprache } from '../i18n/SprachKontext';
import { BewerbungFormular } from '../komponenten/formular/BewerbungFormular';
import { alsAnfrage, type Feldfehler, type Formularwerte } from '../komponenten/formular/validierung';
import { IconHaken } from '../komponenten/Icons';
import { Layout } from '../komponenten/Layout';
import { Meldung } from '../komponenten/Meldung';

function alsFormularwerte(b: Bewerbung): Formularwerte {
  return {
    status: b.status,
    nachname: b.nachname,
    vorname: b.vorname,
    email: b.email,
    telefon: b.telefon ?? '',
    stelle: b.stelle,
    standort: b.standort,
    sprache: b.sprache ?? 'de',
    bemerkung: b.bemerkung ?? '',
    dokumente: b.dokumente ?? [],
  };
}

/** S5 Bewerbung bearbeiten. Nach dem Speichern bleibt die Seite offen und zeigt "Aenderungen gespeichert". */
export function BewerbungBearbeiten() {
  const { id = '' } = useParams();
  const { t } = useSprache();
  const navigate = useNavigate();
  const [bewerbung, setBewerbung] = useState<Bewerbung | null>(null);
  const [ladeFehler, setLadeFehler] = useState<'nicht_gefunden' | string | null>(null);
  const [speichertGerade, setSpeichertGerade] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [hinweis, setHinweis] = useState<{ art: 'warnung' | 'fehler'; text: string } | null>(null);
  const [serverFehler, setServerFehler] = useState<Feldfehler>();

  useEffect(() => {
    let aktuell = true;
    bewerbungApi
      .lesen(id)
      .then((b) => aktuell && setBewerbung(b))
      .catch((e) => {
        if (!aktuell) return;
        setLadeFehler(e instanceof ApiFehler && (e.status === 404 || e.status === 400) ? 'nicht_gefunden' : fehlertext(e, t));
      });
    return () => {
      aktuell = false;
    };
  }, [id]);

  // Stabil halten, sonst setzt das Formular bei jedem Rendern die Eingaben zurueck.
  const anfangswerte = useMemo(() => (bewerbung ? alsFormularwerte(bewerbung) : null), [bewerbung]);

  async function speichern(werte: Formularwerte) {
    setSpeichertGerade(true);
    setHinweis(null);
    setGespeichert(false);
    try {
      const geaendert = await bewerbungApi.aendern(id, alsAnfrage(werte, true));
      setBewerbung(geaendert);
      setGespeichert(true);
    } catch (e) {
      if (e instanceof ApiFehler && e.status === 400) {
        setServerFehler(serverFeldfehler(e, t));
        setHinweis({ art: 'fehler', text: t.formular.ungueltig });
      } else if (e instanceof ApiFehler && e.status === 404) {
        setLadeFehler('nicht_gefunden');
      } else {
        setHinweis({ art: 'fehler', text: fehlertext(e, t) });
      }
    } finally {
      setSpeichertGerade(false);
    }
  }

  if (ladeFehler || !bewerbung || !anfangswerte) {
    return (
      <Layout mobilTitel={t.liste.titel}>
        {ladeFehler === 'nicht_gefunden' ? (
          <div className="karte leerzustand">
            <p>{t.detail.nichtGefunden}</p>
            <Link to="/bewerbungen" className="link">
              {t.detail.zurListe}
            </Link>
          </div>
        ) : ladeFehler ? (
          <Meldung art="fehler">{ladeFehler}</Meldung>
        ) : (
          <p className="leerzustand" role="status">
            {t.allgemein.laden}
          </p>
        )}
      </Layout>
    );
  }

  const name = `${bewerbung.vorname} ${bewerbung.nachname}`;

  return (
    <Layout mobilTitel={name}>
      {hinweis && (
        <Meldung art={hinweis.art} className="meldung--oben">
          {hinweis.text}
        </Meldung>
      )}
      <div className="seitenkopf">
        <h1 className="seitenkopf__titel">{t.formular.bearbeitenTitel(name)}</h1>
        {/* Erfolgsmeldung oben rechts (S5), bleibt bis zur naechsten Eingabe stehen. */}
        <div role="status" className="toast-bereich">
          {gespeichert && (
            <span className="toast">
              <IconHaken />
              {t.formular.gespeichert}
            </span>
          )}
        </div>
      </div>
      <BewerbungFormular
        modus="bearbeiten"
        anfangswerte={anfangswerte}
        zuletztGeaendert={bewerbung.aenderungsdatum ?? bewerbung.eingangsdatum}
        serverFehler={serverFehler}
        speichertGerade={speichertGerade}
        beiSpeichern={speichern}
        beiAbbrechen={() => navigate(`/bewerbungen/${id}`)}
        beiEingabe={() => setGespeichert(false)}
      />
    </Layout>
  );
}
