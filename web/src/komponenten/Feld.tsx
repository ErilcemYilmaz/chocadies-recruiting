import { useId, type ReactNode } from 'react';

export interface FeldSteuerung {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
}

interface Props {
  label: string;
  pflicht?: boolean;
  fehler?: string;
  hinweis?: string;
  className?: string;
  /** Erhaelt die ARIA-Attribute, die ans eigentliche Eingabeelement gehoeren. */
  children: (steuerung: FeldSteuerung) => ReactNode;
}

/**
 * Formularfeld mit sichtbarem Label, Pflichtkennzeichnung und Fehlertext
 * direkt beim Feld. Fehler- und Hinweistext sind ueber aria-describedby mit
 * dem Eingabeelement verbunden, damit Screenreader sie beim Fokus vorlesen.
 */
export function Feld({ label, pflicht = false, fehler, hinweis, className = '', children }: Props) {
  const id = useId();
  const fehlerId = `${id}-fehler`;
  const hinweisId = `${id}-hinweis`;
  const beschreibung = [fehler ? fehlerId : null, hinweis ? hinweisId : null].filter(Boolean).join(' ');

  return (
    <div className={`feld ${className}`.trim()}>
      <label htmlFor={id} className="feld__label">
        {label}
        {pflicht && (
          // Stern nur visuell, die Pflicht meldet aria-required am Eingabeelement.
          <span className="feld__pflicht" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': !!fehler,
        'aria-describedby': beschreibung || undefined,
        'aria-required': pflicht || undefined,
      })}
      {fehler && (
        <p id={fehlerId} className="feld__fehler">
          {fehler}
        </p>
      )}
      {hinweis && (
        <p id={hinweisId} className="feld__hinweis">
          {hinweis}
        </p>
      )}
    </div>
  );
}
