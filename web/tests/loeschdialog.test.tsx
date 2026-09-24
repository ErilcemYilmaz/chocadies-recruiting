import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiFehler, bewerbungApi } from '../src/api/client';
import { Bewerbungsdetail } from '../src/seiten/Bewerbungsdetail';
import { beispielBewerbung, rendereSeite, Ziel } from './hilfen';

// Nur die HTTP-Aufrufe ersetzen, ApiFehler & Co. bleiben echt.
vi.mock('../src/api/client', async (original) => {
  const echt = await original<typeof import('../src/api/client')>();
  return {
    ...echt,
    bewerbungApi: { suchen: vi.fn(), lesen: vi.fn(), anlegen: vi.fn(), aendern: vi.fn(), loeschen: vi.fn() },
  };
});

const ID = '6620f1a2c3d4e5f6a7b8c9d0';

async function oeffneDetail() {
  vi.mocked(bewerbungApi.lesen).mockResolvedValue(beispielBewerbung());
  rendereSeite(`/bewerbungen/${ID}`, '/bewerbungen/:id', <Bewerbungsdetail />, [
    <Route key="liste" path="/bewerbungen" element={<Ziel name="liste" />} />,
  ]);
  await screen.findByRole('heading', { level: 1, name: 'Anna Meier' });
}

async function oeffneDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Löschen' }));
  return screen.getByRole('alertdialog', { name: 'Bewerbung löschen?' });
}

describe('Loeschdialog (S6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('oeffnet sich mit Namen der Person, ist modal und setzt den Fokus auf "Abbrechen"', async () => {
    const user = userEvent.setup();
    await oeffneDetail();
    const dialog = await oeffneDialog(user);

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(
      'Die Bewerbung von Anna Meier wird endgültig gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden.',
    );
    expect(within(dialog).getByRole('button', { name: 'Abbrechen' })).toHaveFocus();
  });

  it('schliesst mit Escape ohne zu loeschen und gibt den Fokus an "Löschen" zurueck', async () => {
    const user = userEvent.setup();
    await oeffneDetail();
    await oeffneDialog(user);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toHaveFocus();
    expect(bewerbungApi.loeschen).not.toHaveBeenCalled();
  });

  it('schliesst mit "Abbrechen" ohne zu loeschen', async () => {
    const user = userEvent.setup();
    await oeffneDetail();
    const dialog = await oeffneDialog(user);

    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(bewerbungApi.loeschen).not.toHaveBeenCalled();
  });

  it('haelt den Tastaturfokus im Dialog (Tab und Shift+Tab)', async () => {
    const user = userEvent.setup();
    await oeffneDetail();
    const dialog = await oeffneDialog(user);
    const abbrechen = within(dialog).getByRole('button', { name: 'Abbrechen' });
    const endgueltig = within(dialog).getByRole('button', { name: 'Endgültig löschen' });

    await user.tab();
    expect(endgueltig).toHaveFocus();
    await user.tab();
    expect(abbrechen).toHaveFocus();
    await user.tab({ shift: true });
    expect(endgueltig).toHaveFocus();
  });

  it('loescht per Tastatur und leitet mit Erfolgsmeldung zur Uebersicht', async () => {
    const user = userEvent.setup();
    vi.mocked(bewerbungApi.loeschen).mockResolvedValue(undefined);
    await oeffneDetail();
    await oeffneDialog(user);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(bewerbungApi.loeschen).toHaveBeenCalledWith(ID);
    const ziel = await screen.findByTestId('ziel');
    expect(ziel).toHaveTextContent('liste');
    expect(ziel).toHaveTextContent('"meldung":"geloescht"');
  });

  it('bleibt bei einem Fehler offen und zeigt ihn im Dialog an', async () => {
    const user = userEvent.setup();
    vi.mocked(bewerbungApi.loeschen).mockRejectedValue(new ApiFehler(403, { code: 'KEINE_BERECHTIGUNG', meldung: 'x' }));
    await oeffneDetail();
    const dialog = await oeffneDialog(user);

    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Die Bewerbung konnte nicht gelöscht werden.');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Endgültig löschen' })).toBeEnabled());
    expect(screen.queryByTestId('ziel')).not.toBeInTheDocument();
  });
});
