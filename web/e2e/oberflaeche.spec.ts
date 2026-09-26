import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * Screenshots der Oberflaeche fuer die Dokumentation von Kapitel 4.3
 * (Screens S1 bis S6 gemaess docs/wireframes/, dazu mobil und franzoesisch).
 * Verwendet die Testdaten (npm run testdaten:anlegen) und veraendert nur die
 * Bewerbung von Claudine Rochat (Status in S5), nichts wird geloescht.
 */

const ABLAGE = process.env.E2E_SCREENS ?? path.resolve(process.cwd(), '../docs/screenshots/4.3');

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

async function oeffneRochat(page: Page) {
  await page.goto('/bewerbungen?suche=Rochat');
  await page.getByRole('link', { name: 'Details zu Claudine Rochat' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Claudine Rochat' })).toBeVisible();
}

test('S1 Anmeldung mit Fehlermeldung', async ({ page }) => {
  await page.goto('/anmeldung');
  await page.getByLabel(/^E-Mail/).fill(process.env.E2E_EMAIL ?? '');
  await page.getByLabel(/^Passwort/).fill('falsches-passwort');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await screenshot(page, 'S1-anmeldung');
});

test.describe('angemeldet', () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
  });

  test('S2 Bewerbungen', async ({ page }) => {
    await expect(page.locator('table tbody tr')).toHaveCount(20);
    await screenshot(page, 'S2-bewerbungen');
  });

  test('S2 Bewerbungen franzoesisch', async ({ page }) => {
    await page.getByRole('button', { name: /^FR/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Candidatures' })).toBeVisible();
    await screenshot(page, 'S2-bewerbungen-fr');
  });

  test('S2 mobil mit Filter und Menue', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/bewerbungen?status=in_pruefung&standort=lenzburg');
    await expect(page.locator('.bewerbungskarte')).toHaveCount(3);
    await screenshot(page, 'S2-mobil');
    await page.locator('.filterknopf').click();
    await screenshot(page, 'S2-mobil-filter');
    await page.getByRole('button', { name: 'Menü öffnen' }).click();
    await screenshot(page, 'S2-mobil-menue');
  });

  test('S3 Bewerbungsdetail', async ({ page }) => {
    await oeffneRochat(page);
    await screenshot(page, 'S3-detail');
  });

  test('S4 Neue Bewerbung mit Feldfehler und Datei', async ({ page }) => {
    await page.getByRole('link', { name: '+ Neue Bewerbung' }).click();
    await page.getByRole('textbox', { name: 'Nachname' }).fill('Meier');
    await page.getByRole('textbox', { name: 'Vorname' }).fill('Anna');
    const email = page.getByRole('textbox', { name: 'E-Mail' });
    await email.fill('anna.meier');
    await email.blur();
    await page.setInputFiles('input[type=file]', { name: 'Lebenslauf_Anna_Meier.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await screenshot(page, 'S4-neu-feldfehler');
  });

  test('S4 Neue Bewerbung mit Konflikt', async ({ page }) => {
    await page.getByRole('link', { name: '+ Neue Bewerbung' }).click();
    await page.getByRole('textbox', { name: 'Nachname' }).fill('Rochat');
    await page.getByRole('textbox', { name: 'Vorname' }).fill('Claudine');
    await page.getByRole('textbox', { name: 'E-Mail' }).fill('claudine.rochat@testdaten.example');
    await page.getByRole('textbox', { name: 'Stelle' }).fill('Konditorin');
    await page.getByRole('combobox', { name: 'Standort' }).selectOption('filiale_ch');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'offene Bewerbung' })).toBeVisible();
    await screenshot(page, 'S4-neu-konflikt');
  });

  test('S5 Bewerbung bearbeiten, gespeichert', async ({ page }) => {
    await oeffneRochat(page);
    await page.getByRole('link', { name: 'Bearbeiten' }).click();
    await page.getByRole('combobox', { name: 'Status' }).selectOption('zum_gespraech_eingeladen');
    await page.getByRole('textbox', { name: 'Bemerkung' }).fill('Gute Kandidatin, Erfahrung in der Confiserie. Gespräch vereinbaren.');
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();
    await expect(page.getByText('Änderungen gespeichert')).toBeVisible();
    await screenshot(page, 'S5-bearbeiten');
  });

  test('S6 Loeschen bestaetigen (Dialog)', async ({ page }) => {
    await oeffneRochat(page);
    await page.getByRole('button', { name: 'Löschen' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await screenshot(page, 'S6-loeschdialog');
    // Nur zeigen, nicht loeschen.
    await page.getByRole('button', { name: 'Abbrechen' }).click();
  });
});
