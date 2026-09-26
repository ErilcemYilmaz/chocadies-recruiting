import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthKontext';
import { useSprache } from '../i18n/SprachKontext';
import { IconOrdner, IconPlus, IconSchliessen } from './Icons';
import { SprachUmschalter } from './SprachUmschalter';

interface Props {
  id?: string;
  /** Nur mobil gesetzt: Seitenleiste ist als Schublade geoeffnet. */
  alsSchublade?: boolean;
  beiSchliessen?: () => void;
}

/** Seitenleiste (S2 bis S6): Navigation, angemeldete Person, Sprache, Abmelden. */
export function Seitenleiste({ id, alsSchublade = false, beiSchliessen }: Props) {
  const { t } = useSprache();
  const { benutzer, abmelden } = useAuth();
  const { pathname } = useLocation();

  const neuAktiv = pathname === '/bewerbungen/neu';
  const listeAktiv = pathname.startsWith('/bewerbungen') && !neuAktiv;

  return (
    <aside id={id} className={`seitenleiste${alsSchublade ? ' seitenleiste--schublade' : ''}`}>
      <div className="seitenleiste__kopf">
        <div className="marke">
          <span className="marke__zeichen" aria-hidden="true">
            C
          </span>
          <span className="marke__name">{t.app.name}</span>
        </div>
        {alsSchublade && (
          <button type="button" className="icon-knopf icon-knopf--hell" onClick={beiSchliessen} aria-label={t.navigation.menueSchliessen}>
            <IconSchliessen />
          </button>
        )}
      </div>

      <nav aria-label={t.navigation.hauptmenue}>
        <ul className="navigation">
          <li>
            <Link
              to="/bewerbungen"
              className="navigation__link"
              aria-current={listeAktiv ? 'page' : undefined}
              onClick={beiSchliessen}
            >
              <IconOrdner />
              {t.navigation.bewerbungen}
            </Link>
          </li>
          <li>
            <Link
              to="/bewerbungen/neu"
              className="navigation__link"
              aria-current={neuAktiv ? 'page' : undefined}
              onClick={beiSchliessen}
            >
              <IconPlus />
              {t.navigation.neueBewerbung}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="seitenleiste__fuss">
        {benutzer && (
          <div className="benutzer">
            <span className="benutzer__name">{benutzer.name}</span>
            {benutzer.rolle && <span className="benutzer__rolle">{benutzer.rolle}</span>}
          </div>
        )}
        <div className="seitenleiste__aktionen">
          <SprachUmschalter hell />
          <button type="button" className="text-knopf text-knopf--hell" onClick={abmelden}>
            {t.navigation.abmelden}
          </button>
        </div>
      </div>
    </aside>
  );
}
