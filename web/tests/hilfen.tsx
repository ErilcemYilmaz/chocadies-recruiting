import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { Bewerbung } from '../src/api/typen';
import { AuthAnbieter } from '../src/auth/AuthKontext';
import { SprachAnbieter } from '../src/i18n/SprachKontext';

/** Zeigt Pfad und Navigationszustand an, um Weiterleitungen zu pruefen. */
export function Ziel({ name }: { name: string }) {
  const location = useLocation();
  return (
    <div data-testid="ziel">
      {name} {JSON.stringify(location.state ?? null)}
    </div>
  );
}

/** Rendert eine Seite unter der angegebenen Route mit allen Kontexten der App. */
export function rendereSeite(pfad: string, routenMuster: string, seite: ReactElement, weitereRouten: ReactElement[] = []) {
  return render(
    <SprachAnbieter>
      <AuthAnbieter>
        <MemoryRouter initialEntries={[pfad]}>
          <Routes>
            <Route path={routenMuster} element={seite} />
            {weitereRouten}
          </Routes>
        </MemoryRouter>
      </AuthAnbieter>
    </SprachAnbieter>,
  );
}

export function beispielBewerbung(ueberschreiben: Partial<Bewerbung> = {}): Bewerbung {
  return {
    id: '6620f1a2c3d4e5f6a7b8c9d0',
    nachname: 'Meier',
    vorname: 'Anna',
    email: 'anna.meier@example.ch',
    telefon: '+41 79 123 45 67',
    stelle: 'Verkaufsleiterin',
    standort: 'lenzburg',
    sprache: 'de',
    status: 'in_pruefung',
    bemerkung: 'Gute Kandidatin, Erfahrung im Verkauf.',
    dokumente: [
      { dateiname: 'Lebenslauf_Meier.pdf', typ: 'lebenslauf', url: 'https://dokumente.chocadies.ch/bewerbungen/Lebenslauf_Meier.pdf' },
    ],
    quelle: 'webshop',
    eingangsdatum: '2026-03-12T09:00:00Z',
    aenderungsdatum: '2026-03-15T09:00:00Z',
    ...ueberschreiben,
  };
}
