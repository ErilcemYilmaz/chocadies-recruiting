import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthKontext';
import { useSprache } from '../i18n/SprachKontext';
import { Feld } from '../komponenten/Feld';
import { IconWarnung } from '../komponenten/Icons';
import { SprachUmschalter } from '../komponenten/SprachUmschalter';

/** S1 Anmeldung. Zur Pruefung der Zugangsdaten im Prototyp siehe AuthKontext. */
export function Anmeldung() {
  const { t } = useSprache();
  const a = t.anmeldung;
  const { benutzer, anmelden, sitzungAbgelaufen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState<'zugangsdaten' | 'pflicht' | null>(null);

  const ziel = (location.state as { von?: string } | null)?.von ?? '/bewerbungen';
  if (benutzer) return <Navigate to={ziel} replace />;

  function absenden(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !passwort) {
      setFehler('pflicht');
      return;
    }
    if (anmelden(email, passwort)) {
      navigate(ziel, { replace: true });
    } else {
      setFehler('zugangsdaten');
    }
  }

  const emailFehler = fehler === 'pflicht' && !email.trim() ? t.formular.fehlerPflicht : undefined;
  const passwortFehler = fehler === 'pflicht' && !passwort ? t.formular.fehlerPflicht : undefined;

  return (
    <div className="anmeldung">
      <div className="anmeldung__sprache">
        <SprachUmschalter />
      </div>
      <main className="anmeldung__karte">
        <div className="anmeldung__logo" aria-hidden="true">
          {a.logo}
        </div>
        <h1 className="anmeldung__titel">{a.titel}</h1>
        <p className="anmeldung__untertitel">{a.untertitel}</p>

        {sitzungAbgelaufen && !fehler && (
          <p className="anmeldung__fehler" role="status">
            {a.sitzungAbgelaufen}
          </p>
        )}

        <form onSubmit={absenden} noValidate>
          <Feld label={a.email} pflicht fehler={emailFehler}>
            {(steuerung) => (
              <input
                {...steuerung}
                type="email"
                className="eingabe"
                autoComplete="username"
                placeholder={a.emailPlatzhalter}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Feld>
          <Feld label={a.passwort} pflicht fehler={passwortFehler}>
            {(steuerung) => (
              <input
                {...steuerung}
                type="password"
                className="eingabe"
                autoComplete="current-password"
                placeholder="••••••••"
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
              />
            )}
          </Feld>

          {fehler === 'zugangsdaten' && (
            <p className="anmeldung__fehler" role="alert">
              <IconWarnung />
              {a.fehlerZugangsdaten}
            </p>
          )}

          <button type="submit" className="knopf knopf--primaer knopf--breit">
            {a.anmelden}
          </button>
        </form>
      </main>
    </div>
  );
}
