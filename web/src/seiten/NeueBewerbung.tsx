import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiFehler, bewerbungApi } from '../api/client';
import { fehlertext, serverFeldfehler } from '../api/fehlertext';
import { useSprache } from '../i18n/SprachKontext';
import { BewerbungFormular } from '../komponenten/formular/BewerbungFormular';
import { alsAnfrage, LEERE_WERTE, type Feldfehler, type Formularwerte } from '../komponenten/formular/validierung';
import { Layout } from '../komponenten/Layout';
import { Meldung } from '../komponenten/Meldung';

type Hinweis = { art: 'warnung' | 'fehler'; text: string } | null;

/** S4 Neue Bewerbung. 409 erscheint als gelbe Warnung oben (Wireframe). */
export function NeueBewerbung() {
  const { t } = useSprache();
  const navigate = useNavigate();
  const [speichertGerade, setSpeichertGerade] = useState(false);
  const [hinweis, setHinweis] = useState<Hinweis>(null);
  const [serverFehler, setServerFehler] = useState<Feldfehler>();

  async function speichern(werte: Formularwerte) {
    setSpeichertGerade(true);
    setHinweis(null);
    try {
      const neu = await bewerbungApi.anlegen(alsAnfrage(werte, false));
      navigate(`/bewerbungen/${neu.id}`, { state: { meldung: 'angelegt' } });
    } catch (e) {
      if (e instanceof ApiFehler && e.status === 409) {
        setHinweis({ art: 'warnung', text: t.formular.konflikt });
      } else if (e instanceof ApiFehler && e.status === 400) {
        setServerFehler(serverFeldfehler(e, t));
        setHinweis({ art: 'fehler', text: t.formular.ungueltig });
      } else {
        setHinweis({ art: 'fehler', text: fehlertext(e, t) });
      }
      setSpeichertGerade(false);
      window.scrollTo({ top: 0 });
    }
  }

  return (
    <Layout mobilTitel={t.navigation.neueBewerbung}>
      {hinweis && (
        <Meldung art={hinweis.art} className="meldung--oben">
          {hinweis.text}
        </Meldung>
      )}
      <h1 className="seitenkopf__titel seitenkopf__titel--abstand">{t.formular.neuTitel}</h1>
      <BewerbungFormular
        modus="neu"
        anfangswerte={LEERE_WERTE}
        serverFehler={serverFehler}
        speichertGerade={speichertGerade}
        beiSpeichern={speichern}
        beiAbbrechen={() => navigate('/bewerbungen')}
      />
    </Layout>
  );
}
