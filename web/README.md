# web

SPA Web-App der Chocadies Recruiting-Plattform (Kapitel 4.3): React 19,
Vite, TypeScript, eigenes CSS ohne UI-Bibliothek. Umsetzung der Wireframes
`docs/wireframes/` (S1 bis S6, S2 mobil).

## Starten

Voraussetzung: Die Server-App laeuft auf `http://localhost:3000`
(`cd server && npm run dev`). Der Vite-Server leitet `/v1` dorthin weiter,
deshalb braucht die API keine CORS-Konfiguration.

```bash
cd web
npm install
# web/.env.local anlegen (siehe unten), wird nie committet
npm run dev      # http://localhost:5173
npm test         # Vitest + Testing Library (jsdom), ohne Server
npm run build    # Typpruefung + Produktions-Build nach dist/
```

## Prototyp-Anmeldung (`web/.env.local`)

Die Web-API stellt keine Tokens aus (`api/openapi.yaml`, bearerAuth). Bis
ein Anmeldedienst angebunden ist, prueft die Anmeldemaske ein Demo-Konto und
verwendet ein Test-Token:

```
VITE_DEMO_EMAIL=anna.mueller@chocadies.ch
VITE_DEMO_PASSWORT=<frei waehlbar>
VITE_DEMO_NAME=Anna Müller
VITE_DEMO_ROLLE=HR Managerin
VITE_API_TOKEN=<Ausgabe von: cd server && npm run token:intern>
```

Das Token ist 8 Stunden gueltig. Danach meldet die API 401, die SPA
wechselt zur Anmeldung ("Sitzung abgelaufen"), und ein neues Token muss
eingetragen werden (Vite danach neu starten). Diese Werte landen im
Browser-Bundle und sind nur fuer die lokale Entwicklung gedacht.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/api/` | Typen nach `openapi.yaml`, HTTP-Client (einzige Stelle mit `fetch`), Fehlertexte |
| `src/auth/` | Anmeldung und Sitzung (Prototyp) |
| `src/i18n/` | `uebersetzungen.ts` (alle Texte DE/FR), `anzeigenamen.ts` (Enum-Werte), Sprachkontext |
| `src/komponenten/` | Seitenleiste, Layout, Dialog, Feld, Meldung, Formular S4/S5 |
| `src/seiten/` | Screens S1 bis S5 (S6 ist der Dialog auf S3) |
| `src/styles/` | `variablen.css` (Farben, Schrift, 8-px-Raster), `app.css` |
| `tests/` | Loeschdialog, Sprachumschaltung, Formularvalidierung |
