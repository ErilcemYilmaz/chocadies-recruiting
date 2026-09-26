import type { ReactNode } from 'react';
import { IconHaken, IconWarnung } from './Icons';

type Art = 'warnung' | 'fehler' | 'erfolg';

interface Props {
  art: Art;
  children: ReactNode;
  className?: string;
}

/** Warnung, Fehler (role="alert", sofort vorgelesen) oder Erfolg (role="status"). */
export function Meldung({ art, children, className = '' }: Props) {
  return (
    <div className={`meldung meldung--${art} ${className}`.trim()} role={art === 'erfolg' ? 'status' : 'alert'}>
      <span className="meldung__icon">{art === 'erfolg' ? <IconHaken /> : <IconWarnung />}</span>
      <span>{children}</span>
    </div>
  );
}
