import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * Systemtest der SPA (Kapitel 4.4.3), Testfaelle TF-01 bis TF-14 aus
 * tests/systemtest-4.4.3.md. Die Erwartungen sind fachlich formuliert und
 * 1:1 aus der Vorlage uebernommen. Schlaegt ein Testfall fehl, ist das ein
 * Befund. Jeder Testfall legt vor den Pruefungen einen Screenshot ab, damit
 * er auch bei einem Fehler dokumentiert ist.
 */

const ABLAGE = process.env.E2E_SCREENSHOTS ?? path.resolve(process.cwd(), '../docs/systemtest');
const HEUTE = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(ABLAGE, `${name}.png`) });
}

async function anmelden(page: Page) {
  await page.goto('/anmeldung');
  await page.getByLabel(/^E-Mail/).fill(process.env.E2E_EMAIL ?? '');
  await page.getByLabel(/^Passwort/).fill(process.env.E2E_PASSWORT ?? '');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Bewerbungen' })).toBeVisible();
}

/** Oeffnet die Detailansicht einer Person ueber die Suche nach ihrem Nachnamen. */
async function oeffneDetail(page: Page, nachname: string, name: string) {
  await page.goto(`/bewerbungen?suche=${encodeURIComponent(nachname)}`);
  await page.getByRole('link', { name: `Details zu ${name}` }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

async function suche(page: Page, begriff: string) {
  await page.getByRole('searchbox', { name: 'Suche' }).fill(begriff);
  await expect(page).toHaveURL(new RegExp(`suche=${encodeURIComponent(begriff)}`));
  await expect(page.locator('[aria-busy="false"]')).toBeVisible();
}

const zeilen = (page: Page) => page.locator('table tbody tr');

test.beforeEach(async ({ page }) => {
  await anmelden(page);
});

test.describe('Basisfall 1: Neu erfassen', () => {
  test('TF-01 gueltige Bewerbung erfassen', async ({ page }) => {
    await page.getByRole('link', { name: '+ Neue Bewerbung' }).click();
    await page.getByRole('textbox', { name: 'Nachname' }).fill('Beispiel');
    await page.getByRole('textbox', { name: 'Vorname' }).fill('Nora');
    await page.getByRole('textbox', { name: 'E-Mail' }).fill('nora.beispiel@testdaten.example');
    await page.getByRole('textbox', { name: 'Telefon' }).fill('+41 79 111 22 33');
    await page.getByRole('textbox', { name: 'Stelle' }).fill('Chocolatière');
    await page.getByRole('combobox', { name: 'Standort' }).selectOption('lenzburg');
    await page.getByRole('radio', { name: 'Französisch' }).check();
    await page.setInputFiles('input[type=file]', { name: 'Lebenslauf_Beispiel.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
    await page.getByRole('textbox', { name: 'Bemerkung' }).fill('Erfasst im Systemtest TF-01.');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Nora Beispiel' })).toBeVisible();
    await screenshot(page, 'TF-01');
    await expect(page.getByText('Die Bewerbung wurde erfasst.')).toBeVisible();
    await expect(page.locator('.seitenkopf .badge')).toHaveText('Eingegangen');
    const angaben = page.locator('.angaben');
    await expect(angaben.getByText('nora.beispiel@testdaten.example')).toBeVisible();
    await expect(angaben.getByText('+41 79 111 22 33')).toBeVisible();
    await expect(angaben.getByText('Französisch')).toBeVisible();
    await expect(angaben.getByText('Chocolatière')).toBeVisible();
    await expect(angaben.getByText(HEUTE).first()).toBeVisible();
    const dokumente = page.getByRole('table');
    await expect(dokumente.getByRole('row', { name: /Lebenslauf.*Lebenslauf_Beispiel\.pdf/ })).toBeVisible();
  });

  test('TF-02 Pflichtfelder und ungueltige E-Mail', async ({ page }) => {
    await page.getByRole('link', { name: '+ Neue Bewerbung' }).click();
    await page.getByRole('textbox', { name: 'E-Mail' }).fill('nora.beispiel');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await screenshot(page, 'TF-02');

    await expect(page).toHaveURL(/\/bewerbungen\/neu$/);
    for (const feld of ['Nachname', 'Vorname', 'Stelle']) {
      const eingabe = page.getByRole('textbox', { name: feld });
      await expect(eingabe).toHaveAttribute('aria-invalid', 'true');
      await expect(eingabe).toHaveAccessibleDescription('Bitte dieses Feld ausfüllen.');
    }
    await expect(page.getByRole('combobox', { name: 'Standort' })).toHaveAccessibleDescription('Bitte Standort auswählen.');
    await expect(page.getByRole('textbox', { name: 'E-Mail' })).toHaveAccessibleDescription('Bitte gültige E-Mail-Adresse eingeben.');
    await expect(page.getByRole('textbox', { name: 'Nachname' })).toBeFocused();
  });

  test('TF-03 Doppelbewerbung wird verhindert', async ({ page }) => {
    await page.getByRole('link', { name: '+ Neue Bewerbung' }).click();
    await page.getByRole('textbox', { name: 'Nachname' }).fill('Meier');
    await page.getByRole('textbox', { name: 'Vorname' }).fill('Sophie');
    await page.getByRole('textbox', { name: 'E-Mail' }).fill('sophie.meier@testdaten.example');
    await page.getByRole('textbox', { name: 'Stelle' }).fill('Verkaufsleiterin');
    await page.getByRole('combobox', { name: 'Standort' }).selectOption('lenzburg');
    await page.getByRole('button', { name: 'Speichern' }).click();

    const warnung = page.getByRole('alert').filter({ hasText: 'offene Bewerbung' });
    await expect(warnung).toBeVisible();
    await screenshot(page, 'TF-03');
    await expect(warnung).toHaveText('Für diese E-Mail und Stelle besteht bereits eine offene Bewerbung.');
    await expect(page.getByRole('textbox', { name: 'E-Mail' })).toHaveValue('sophie.meier@testdaten.example');
    await expect(page).toHaveURL(/\/bewerbungen\/neu$/);
  });
});

test.describe('Basisfall 2: Suchen', () => {
  test('TF-04 Suche nach vollstaendigem Nachnamen', async ({ page }) => {
    await suche(page, 'Rochat');
    await screenshot(page, 'TF-04');
    await expect(zeilen(page)).toHaveCount(1);
    await expect(zeilen(page).first()).toContainText('Claudine Rochat');
    await expect(zeilen(page).first()).toContainText('Konditorin');
    await expect(zeilen(page).first()).toContainText('Filiale Schweiz');
  });

  test('TF-05 Suche nach Wortanfang', async ({ page }) => {
    await suche(page, 'Roch');
    await screenshot(page, 'TF-05');
    await expect(page.getByRole('table')).toContainText('Claudine Rochat');
  });

  test('TF-06 Filter Status und Standort, zuruecksetzen', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Status' }).selectOption('in_pruefung');
    await page.getByRole('combobox', { name: 'Standort' }).selectOption('lenzburg');
    await expect(zeilen(page)).toHaveCount(3);
    await screenshot(page, 'TF-06');
    for (const name of ['Luca Bernasconi', 'Sarah Frei', 'Reto Baumann']) {
      await expect(page.getByRole('table')).toContainText(name);
    }
    await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
    await expect(page.getByText('Seite 1 von 2')).toBeVisible();
    await expect(zeilen(page)).toHaveCount(20);
  });

  test('TF-07 Blaettern', async ({ page }) => {
    // exact: sonst trifft 'Zurück' auch 'Filter zurücksetzen'.
    const zurueck = page.getByRole('button', { name: 'Zurück', exact: true });
    await expect(page.getByText('Seite 1 von 2')).toBeVisible();
    await expect(zurueck).toBeDisabled();
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await expect(page.getByText('Seite 2 von 2')).toBeVisible();
    await screenshot(page, 'TF-07');
    await expect(page.getByRole('button', { name: 'Weiter', exact: true })).toBeDisabled();
    expect(await zeilen(page).count()).toBeGreaterThan(0);
    await zurueck.click();
    await expect(page.getByText('Seite 1 von 2')).toBeVisible();
  });
});

test.describe('Basisfall 3: Aendern', () => {
  test('TF-08 Status und Bemerkung aendern', async ({ page }) => {
    await oeffneDetail(page, 'Schwarz', 'Nadine Schwarz');
    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    await page.getByRole('combobox', { name: 'Status' }).selectOption('zum_gespraech_eingeladen');
    await page.getByRole('textbox', { name: 'Bemerkung' }).fill('Gespräch am 05.10.');
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();

    await expect(page.getByText('Änderungen gespeichert')).toBeVisible();
    await screenshot(page, 'TF-08');
    await expect(page.getByText(`Zuletzt geändert am ${HEUTE}`)).toBeVisible();

    await page.goto('/bewerbungen?suche=Schwarz');
    await expect(zeilen(page).first()).toContainText('Zum Gespräch eingeladen');
    await page.getByRole('link', { name: 'Details zu Nadine Schwarz' }).click();
    await expect(page.locator('.seitenkopf .badge')).toHaveText('Zum Gespräch eingeladen');
    await expect(page.locator('.bemerkung')).toHaveText('Gespräch am 05.10.');
  });

  test('TF-09 Telefonnummer entfernen', async ({ page }) => {
    await oeffneDetail(page, 'Meier', 'Sophie Meier');
    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    await expect(page.getByRole('textbox', { name: 'Telefon' })).toHaveValue('+41 79 123 45 67');
    await page.getByRole('textbox', { name: 'Telefon' }).fill('');
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();
    await expect(page.getByText('Änderungen gespeichert')).toBeVisible();

    await oeffneDetail(page, 'Meier', 'Sophie Meier');
    await screenshot(page, 'TF-09');
    const telefon = page.locator('.angaben div').filter({ has: page.getByText('Telefon', { exact: true }) });
    await expect(telefon.locator('dd')).toHaveText('–');
  });

  test('TF-10 Pflichtfeld beim Aendern leeren', async ({ page }) => {
    await oeffneDetail(page, 'Fontaine', 'Marcel Fontaine');
    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    const email = page.getByRole('textbox', { name: 'E-Mail' });
    await email.fill('');
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();
    await screenshot(page, 'TF-10');
    await expect(email).toHaveAccessibleDescription('Bitte dieses Feld ausfüllen.');
    await expect(page.getByText('Änderungen gespeichert')).toHaveCount(0);

    await page.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Marcel Fontaine' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'marcel.fontaine@testdaten.example' })).toBeVisible();
  });
});

test.describe('Basisfall 4: Loeschen', () => {
  test('TF-11 Loeschen abbrechen', async ({ page }) => {
    await oeffneDetail(page, 'Beispiel', 'Nora Beispiel');
    const loeschen = page.getByRole('button', { name: 'Löschen' });
    await loeschen.click();
    const dialog = page.getByRole('alertdialog', { name: 'Bewerbung löschen?' });
    await expect(dialog).toBeVisible();
    await screenshot(page, 'TF-11');
    await expect(dialog).toContainText('Die Bewerbung von Nora Beispiel wird endgültig gelöscht.');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(loeschen).toBeFocused();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Nora Beispiel' })).toBeVisible();
  });

  test('TF-12 Loeschen bestaetigen', async ({ page }) => {
    await oeffneDetail(page, 'Beispiel', 'Nora Beispiel');
    const adresse = page.url();
    await page.getByRole('button', { name: 'Löschen' }).click();
    await page.getByRole('button', { name: 'Endgültig löschen' }).click();

    await expect(page.getByText('Die Bewerbung wurde gelöscht.')).toBeVisible();
    await screenshot(page, 'TF-12');
    await expect(page).toHaveURL(/\/bewerbungen$/);
    await expect(page.getByRole('table')).not.toContainText('Nora Beispiel');

    await page.goto(adresse);
    await expect(page.getByText('Diese Bewerbung existiert nicht oder wurde gelöscht.')).toBeVisible();
    await screenshot(page, 'TF-12b');
  });
});

test.describe('Optional: Querschnitt', () => {
  test('TF-13 Sprache Franzoesisch', async ({ page }) => {
    await page.getByRole('button', { name: /^FR/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Candidatures' })).toBeVisible();
    await screenshot(page, 'TF-13');
    await expect(page.getByRole('table')).toContainText('Filiale Suisse');
    await expect(page.getByRole('table')).toContainText('En examen');
    await page.getByRole('button', { name: /^DE/ }).click();
  });

  test('TF-14 Smartphone-Ansicht', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.locator('.filterknopf').click();
    await page.getByRole('combobox', { name: 'Status' }).selectOption('eingegangen');
    await page.locator('.filterknopf').click();
    await expect(page.getByRole('button', { name: 'Filter (1 Filter aktiv)' })).toBeVisible();
    await screenshot(page, 'TF-14');
    await expect(page.getByRole('button', { name: 'Menü öffnen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Neue Bewerbung' })).toBeVisible();
    await expect(page.locator('.bewerbungskarte').first()).toBeVisible();
    await expect(page.getByRole('table')).toBeHidden();
  });
});
