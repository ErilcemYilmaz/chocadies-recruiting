# chocadies-recruiting

Personalgewinnungsplattform der Chocolatier Chocadies AG (APDE
Transferaufgabe).

## Struktur

| Ordner | Inhalt | Kapitel |
|---|---|---|
| `api` | API-Spezifikation `openapi.yaml` (OpenAPI 3.1) | 4.1 |
| `docs` | Komponentendiagramm (PlantUML), Deployment-Anleitung | 4.1, 4.4 |
| `server` | Server-App (Node.js 22, TypeScript, Express, MongoDB/Mongoose) | 4.2 |
| `tests` | Postman-Collection fuer die API-Tests | 4.2 |
| `web` | SPA Web-App (React, Vite, TypeScript) | 4.3 |
| `.github/workflows`, `Dockerfile`, `docker-compose.yml` | CI/CD und Container | 4.4 |

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

## Web-App lokal starten

Server wie oben starten, dann:

```bash
cd web
npm install
# web/.env.local mit Demo-Anmeldung und Token anlegen, siehe web/README.md
npm run dev            # SPA unter http://localhost:5173
npm test               # Vitest + Testing Library, ohne Server
```

## Container und Deployment

Beide Apps als Container lokal starten:

```bash
docker compose --env-file web/.env.local up --build   # SPA unter http://localhost:8080
```

CI/CD (GitHub Actions, GHCR, Azure Container Apps), Secrets und Rollback:
siehe `docs/deployment.md`.
