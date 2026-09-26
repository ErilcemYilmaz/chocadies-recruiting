import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSprache } from '../i18n/SprachKontext';
import { IconMenue, IconPlus } from './Icons';
import { Seitenleiste } from './Seitenleiste';

interface Props {
  /** Titel in der mobilen Kopfzeile (S2 mobil). */
  mobilTitel: string;
  children: ReactNode;
}

/**
 * Grundlayout: ab 768 px feste Seitenleiste, darunter Kopfzeile mit Menue,
 * die Seitenleiste oeffnet sich dann als Schublade.
 */
export function Layout({ mobilTitel, children }: Props) {
  const { t } = useSprache();
  const [schubladeOffen, setSchubladeOffen] = useState(false);
  const menueKnopf = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  // Beim Seitenwechsel Schublade schliessen.
  useEffect(() => setSchubladeOffen(false), [pathname]);

  useEffect(() => {
    if (!schubladeOffen) return;
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') schliessen();
    };
    document.addEventListener('keydown', beiTaste);
    document.querySelector<HTMLElement>('#schublade .navigation__link')?.focus();
    return () => document.removeEventListener('keydown', beiTaste);
  }, [schubladeOffen]);

  function schliessen() {
    setSchubladeOffen(false);
    menueKnopf.current?.focus();
  }

  return (
    <div className="app">
      <div className="app__seitenleiste">
        <Seitenleiste />
      </div>

      <header className="mobil-kopf">
        <button
          ref={menueKnopf}
          type="button"
          className="icon-knopf"
          aria-label={t.navigation.menueOeffnen}
          aria-expanded={schubladeOffen}
          aria-controls="schublade"
          onClick={() => setSchubladeOffen(true)}
        >
          <IconMenue />
        </button>
        <span className="mobil-kopf__titel">{mobilTitel}</span>
        <Link to="/bewerbungen/neu" className="rund-knopf" aria-label={t.navigation.neueBewerbung}>
          <IconPlus />
        </Link>
      </header>

      {schubladeOffen && (
        <div className="schublade">
          <div className="schublade__hintergrund" onClick={schliessen} aria-hidden="true" />
          <Seitenleiste id="schublade" alsSchublade beiSchliessen={schliessen} />
        </div>
      )}

      <main className="app__inhalt" id="inhalt">
        {children}
      </main>
    </div>
  );
}
