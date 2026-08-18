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
cp .env.example .env   # MONGODB_URI aus MongoDB Atlas eintragen
npm run db:test        # prueft die MongoDB-Verbindung
npm run dev
```
