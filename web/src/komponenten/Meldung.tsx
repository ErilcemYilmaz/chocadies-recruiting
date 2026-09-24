import type { ReactNode } from 'react';
import { IconHaken, IconWarnung } from './Icons';

type Art = 'warnung' | 'fehler' | 'erfolg';

interface Props {
  art: Art;
  children: ReactNode;
  className?: string;
}

/**
 * Hinweis- und Statusmeldungen: Warnung (S4, 409 Konflikt), Fehler und
 * Erfolg (S5, "Aenderungen gespeichert"). Warnung/Fehler werden als
 * role="alert" sofort vorgelesen, Erfolg hoeflich als role="status".
 */
export function Meldung({ art, children, className = '' }: Props) {
  return (
    <div className={`meldung meldung--${art} ${className}`.trim()} role={art === 'erfolg' ? 'status' : 'alert'}>
      <span className="meldung__icon">{art === 'erfolg' ? <IconHaken /> : <IconWarnung />}</span>
      <span>{children}</span>
    </div>
  );
}
