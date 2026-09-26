import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiFehler, bewerbungApi } from '../src/api/client';
import { NeueBewerbung } from '../src/seiten/NeueBewerbung';
import { rendereSeite } from './hilfen';

vi.mock('../src/api/client', async (original) => {
  const echt = await original<typeof import('../src/api/client')>();
  return {
    ...echt,
    bewerbungApi: { suchen: vi.fn(), lesen: vi.fn(), anlegen: vi.fn(), aendern: vi.fn(), loeschen: vi.fn() },
  };
});

async function fuelleGueltigAus(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Nachname' }), 'Meier');
  await user.type(screen.getByRole('textbox', { name: 'Vorname' }), 'Anna');
  await user.type(screen.getByRole('textbox', { name: 'E-Mail' }), 'anna.meier@example.ch');
  await user.type(screen.getByRole('textbox', { name: 'Stelle' }), 'Verkaufsleiterin');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Standort' }), 'lenzburg');
}

describe('Formular Neue Bewerbung (S4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('zeigt Fehler als Text beim Feld und fokussiert das erste fehlerhafte Feld', async () => {
    const user = userEvent.setup();
    rendereSeite('/bewerbungen/neu', '/bewerbungen/neu', <NeueBewerbung />);

    await user.type(screen.getByRole('textbox', { name: 'E-Mail' }), 'anna.meier');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    const nachname = screen.getByRole('textbox', { name: 'Nachname' });
    const email = screen.getByRole('textbox', { name: 'E-Mail' });
    expect(nachname).toHaveAttribute('aria-invalid', 'true');
    expect(nachname).toBeRequired();
    expect(email).toHaveAccessibleDescription('Bitte gültige E-Mail-Adresse eingeben.');
    await vi.waitFor(() => expect(nachname).toHaveFocus());
    expect(bewerbungApi.anlegen).not.toHaveBeenCalled();
  });

  it('zeigt bei 409 die Warnung zur offenen Bewerbung', async () => {
    const user = userEvent.setup();
    vi.mocked(bewerbungApi.anlegen).mockRejectedValue(new ApiFehler(409, { code: 'OFFENE_BEWERBUNG_VORHANDEN', meldung: 'x' }));
    rendereSeite('/bewerbungen/neu', '/bewerbungen/neu', <NeueBewerbung />);

    await fuelleGueltigAus(user);
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Für diese E-Mail und Stelle besteht bereits eine offene Bewerbung.',
    );
    expect(bewerbungApi.anlegen).toHaveBeenCalledWith(
      expect.objectContaining({ nachname: 'Meier', standort: 'lenzburg', sprache: 'de', dokumente: [] }),
    );
    // Leere optionale Felder gehen nicht an die API (Telefon-Pattern wuerde "" ablehnen).
    expect(vi.mocked(bewerbungApi.anlegen).mock.calls[0][0]).not.toHaveProperty('telefon');
  });

  it('nimmt beim Mausdruck auf Speichern den Fokus nicht aus dem Feld (Befund B-1)', async () => {
    const user = userEvent.setup();
    rendereSeite('/bewerbungen/neu', '/bewerbungen/neu', <NeueBewerbung />);
    const email = screen.getByRole('textbox', { name: 'E-Mail' });
    await user.type(email, 'anna.meier');

    // false = Standardaktion (Fokuswechsel und damit Blur-Pruefung) verhindert
    const standardAusgefuehrt = fireEvent.mouseDown(screen.getByRole('button', { name: 'Speichern' }));

    expect(standardAusgefuehrt).toBe(false);
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-invalid', 'false');
  });
});
