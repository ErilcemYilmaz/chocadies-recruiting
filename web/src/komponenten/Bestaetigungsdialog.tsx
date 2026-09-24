import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { IconWarnung } from './Icons';

interface Props {
  titel: string;
  text: string;
  abbrechenText: string;
  bestaetigenText: string;
  beiAbbrechen: () => void;
  beiBestaetigen: () => void;
  /** Waehrend die Anfrage laeuft, sind beide Knoepfe gesperrt. */
  beschaeftigt?: boolean;
  fehler?: string;
}

/**
 * Modaler Bestaetigungsdialog (S6). Tastaturbedienung nach WAI-ARIA
 * Authoring Practices "Alert Dialog":
 * - Fokus startet auf "Abbrechen" (sichere Wahl bei einer endgueltigen Aktion),
 * - Tab/Shift+Tab bleiben im Dialog (Fokusfalle),
 * - Escape bricht ab,
 * - nach dem Schliessen kehrt der Fokus zum ausloesenden Element zurueck.
 * Nicht mit <dialog>.showModal() umgesetzt, weil jsdom (Tests) es nicht kennt.
 */
export function Bestaetigungsdialog({
  titel,
  text,
  abbrechenText,
  bestaetigenText,
  beiAbbrechen,
  beiBestaetigen,
  beschaeftigt = false,
  fehler,
}: Props) {
  const titelId = useId();
  const textId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const abbrechenKnopf = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const vorher = document.activeElement as HTMLElement | null;
    abbrechenKnopf.current?.focus();
    // Hintergrund nicht scrollen, solange der Dialog offen ist.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      vorher?.focus();
    };
  }, []);

  function beiTaste(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (!beschaeftigt) beiAbbrechen();
      return;
    }
    if (e.key !== 'Tab' || !dialog.current) return;

    const fokussierbar = Array.from(
      dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
    );
    if (fokussierbar.length === 0) return;
    const erstes = fokussierbar[0];
    const letztes = fokussierbar[fokussierbar.length - 1];
    if (e.shiftKey && document.activeElement === erstes) {
      e.preventDefault();
      letztes.focus();
    } else if (!e.shiftKey && document.activeElement === letztes) {
      e.preventDefault();
      erstes.focus();
    }
  }

  return (
    <div className="dialog-hintergrund">
      <div
        ref={dialog}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titelId}
        aria-describedby={textId}
        onKeyDown={beiTaste}
      >
        <div className="dialog__kopf">
          <span className="dialog__icon">
            <IconWarnung />
          </span>
          <h2 id={titelId} className="dialog__titel">
            {titel}
          </h2>
        </div>
        <p id={textId} className="dialog__text">
          {text}
        </p>
        {fehler && (
          <p className="feld__fehler" role="alert">
            {fehler}
          </p>
        )}
        <div className="dialog__aktionen">
          <button ref={abbrechenKnopf} type="button" className="knopf knopf--sekundaer" onClick={beiAbbrechen} disabled={beschaeftigt}>
            {abbrechenText}
          </button>
          <button type="button" className="knopf knopf--gefahr" onClick={beiBestaetigen} disabled={beschaeftigt}>
            {bestaetigenText}
          </button>
        </div>
      </div>
    </div>
  );
}
