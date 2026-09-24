import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bewerbungApi } from '../src/api/client';
import { DOKUMENTTYP_WERTE, QUELLE_WERTE, SPRACH_WERTE, STANDORT_WERTE, STATUS_WERTE } from '../src/api/typen';
import { anzeigename } from '../src/i18n/anzeigenamen';
import { uebersetzungen } from '../src/i18n/uebersetzungen';
import { Anmeldung } from '../src/seiten/Anmeldung';
import { Bewerbungsliste } from '../src/seiten/Bewerbungsliste';
import { beispielBewerbung, rendereSeite } from './hilfen';

vi.mock('../src/api/client', async (original) => {
  const echt = await original<typeof import('../src/api/client')>();
  return {
    ...echt,
    bewerbungApi: { suchen: vi.fn(), lesen: vi.fn(), anlegen: vi.fn(), aendern: vi.fn(), loeschen: vi.fn() },
  };
});

describe('Sprachumschaltung DE/FR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startet auf Deutsch und schaltet die Anmeldung auf Franzoesisch um', async () => {
    const user = userEvent.setup();
    rendereSeite('/anmeldung', '/anmeldung', <Anmeldung />);

    expect(screen.getByRole('heading', { name: 'Anmeldung Personalgewinnung' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de');

    await user.click(screen.getByRole('button', { name: /^FR/ }));

    expect(screen.getByRole('heading', { name: 'Connexion Recrutement' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^FR/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^DE/ })).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem('chocadies.sprache')).toBe('fr');
  });

  it('merkt sich die Sprache und uebersetzt auch Enum-Werte und Seitenleiste', async () => {
    const user = userEvent.setup();
    localStorage.setItem('chocadies.sprache', 'fr');
    vi.mocked(bewerbungApi.suchen).mockResolvedValue({
      treffer: [beispielBewerbung({ status: 'in_pruefung', standort: 'filiale_ch' })],
      seite: 1,
      proSeite: 20,
      gesamt: 1,
    });
    rendereSeite('/bewerbungen', '/bewerbungen', <Bewerbungsliste />);

    const tabelle = await screen.findByRole('table', { name: 'Liste des candidatures' });
    expect(within(tabelle).getByRole('columnheader', { name: 'Poste' })).toBeInTheDocument();
    expect(within(tabelle).getByText('En examen')).toBeInTheDocument();
    expect(within(tabelle).getByText('Filiale Suisse')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Candidatures' }).length).toBeGreaterThan(0);

    // In der Seitenleiste zurueck auf Deutsch
    const navigation = screen.getAllByRole('group', { name: "Langue de l'interface" })[0];
    await user.click(within(navigation).getByRole('button', { name: /^DE/ }));

    expect(within(tabelle).getByRole('columnheader', { name: 'Stelle' })).toBeInTheDocument();
    expect(within(tabelle).getByText('In Prüfung')).toBeInTheDocument();
    expect(within(tabelle).getByText('Filiale Schweiz')).toBeInTheDocument();
    expect(screen.getByText('1 Bewerbung')).toBeInTheDocument();
    // Sprachwechsel laedt keine Daten neu
    expect(bewerbungApi.suchen).toHaveBeenCalledTimes(1);
  });

  it('hat fuer jeden Text in beiden Sprachen einen nicht leeren Wert', () => {
    function pruefe(de: unknown, fr: unknown, pfad: string) {
      if (typeof de === 'function') {
        expect(typeof fr, pfad).toBe('function');
        expect(String((fr as (...a: unknown[]) => string)(1, 2)).trim(), pfad).not.toBe('');
        return;
      }
      if (typeof de === 'object' && de !== null) {
        for (const schluessel of Object.keys(de)) {
          pruefe((de as Record<string, unknown>)[schluessel], (fr as Record<string, unknown>)[schluessel], `${pfad}.${schluessel}`);
        }
        return;
      }
      expect(typeof fr, pfad).toBe('string');
      expect((fr as string).trim(), pfad).not.toBe('');
    }
    pruefe(uebersetzungen.de, uebersetzungen.fr, 'texte');
  });

  it('hat fuer jeden Enum-Wert aus openapi.yaml einen Anzeigenamen in beiden Sprachen', () => {
    for (const sprache of SPRACH_WERTE) {
      for (const wert of STATUS_WERTE) expect(anzeigename.status(wert, sprache)).toBeTruthy();
      for (const wert of STANDORT_WERTE) expect(anzeigename.standort(wert, sprache)).toBeTruthy();
      for (const wert of DOKUMENTTYP_WERTE) expect(anzeigename.dokumenttyp(wert, sprache)).toBeTruthy();
      for (const wert of QUELLE_WERTE) expect(anzeigename.quelle(wert, sprache)).toBeTruthy();
      for (const wert of SPRACH_WERTE) expect(anzeigename.sprache(wert, sprache)).toBeTruthy();
    }
  });
});
