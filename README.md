# chocadies-recruiting

Personalgewinnungsplattform der Chocolatier Chocadies AG (APDE
Transferaufgabe). Technologie-Entscheidungen und Setup-Ablauf siehe
`docs/APDE_Entscheidungen_und_Setup.md`.

## Struktur

- `server` – Server-App (Node.js 22, TypeScript, Express, Mongoose), Kapitel 4.2
- `web` – SPA Web-App (React, Vite), Kapitel 4.3
- `api` – `openapi.yaml`, Kapitel 4.1
- `docs` – Diagramme, Screenshots, Arbeitsprotokolle, KI-Protokoll
- `tests` – Postman-Collection

## Server lokal starten

```bash
cd server
npm install
# .env anlegen (siehe unten), wird nie committet
npm run db:test        # prueft die MongoDB-Verbindung
npm run dev            # API unter http://localhost:3000/v1
npm test               # Vitest/Supertest, ohne Datenbank
npm run test:newman    # Postman-Collection per Newman, ohne Datenbank
```

Benoetigte Variablen in `server/.env`:

```
MONGODB_URI=mongodb+srv://<benutzer>:<passwort>@<cluster-url>/chocadies-recruiting?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
JWT_SECRET=<langer zufaelliger Wert>
```

Test-Tokens fuer Postman: `npm run token:intern` bzw.
`npm run token:vermittler -- <firmaId>`.

## Arbeitsweise

Code und technische Artefakte entstehen mit Claude Code in diesem Repo,
der Fliesstext der Arbeit separat in einem Claude-Projekt. Die Bruecke sind
die Uebergabe-Dateien in `docs/uebergabe/`, Regeln siehe `CLAUDE.md`.
