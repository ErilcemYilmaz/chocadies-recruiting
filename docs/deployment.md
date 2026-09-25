# Deployment

Container-Images der Server-App und der SPA, CI/CD mit GitHub Actions,
Betrieb auf Azure Container Apps (Region Switzerland North), Datenbank
MongoDB Atlas. Kapitel 4.4.1.

```
Push/PR ──► CI (ci.yml) ──────────────────────────────► gruen?
             server · web · api · container               │ nur main
                                                           ▼
                                       Images nach GHCR (Tag = Commit-SHA, latest)
                                                           │
            Deploy (deploy.yml) ◄──────────────────────────┘
             vorbereitung ─► staging (automatisch) ─► production (nach Freigabe)
```

## Lokal starten

Voraussetzung: Docker Desktop, `server/.env` mit `MONGODB_URI` und
`JWT_SECRET` (siehe README.md), optional `web/.env.local` fuer die
Demo-Anmeldung der SPA (siehe web/README.md).

```bash
docker compose --env-file web/.env.local up --build
```

| Adresse | Inhalt |
|---|---|
| http://localhost:8080 | SPA (nginx), `/v1` wird an die Server-App weitergeleitet |
| http://localhost:8080/health | Gesundheitspruefung durch nginx bis zur Server-App |
| http://localhost:3001/health | Server-App direkt (nur zur Diagnose) |

Ohne `--env-file web/.env.local` startet alles ebenfalls, die Anmeldung der
SPA ist dann aber gesperrt. Die Demo-Werte werden beim Build ins JavaScript
geschrieben, lokal gebaute Web-Images deshalb nie in eine Registry pushen.

Beenden: `docker compose down`.

## Pipeline

### CI (`.github/workflows/ci.yml`), bei jedem Push und Pull Request

| Job | Inhalt |
|---|---|
| `server` | `npm ci`, Build, Vitest/Supertest, Newman-Lauf der Postman-Collection, `npm audit --omit=dev --audit-level=high` |
| `web` | `npm ci`, Build, Vitest, `npm audit --omit=dev --audit-level=high` |
| `api` | `api/openapi.yaml` mit Redocly CLI validieren |
| `container` | beide Images bauen, mit Wegwerf-MongoDB starten und pruefen: `/health`, SPA, SPA-Fallback, `/v1` ohne Token = 401, CSP-Header, Server nicht als root |
| `images` | nur Push auf `main` und nur wenn alle Jobs gruen: Images nach GHCR pushen |

Images: `ghcr.io/erilcemyilmaz/chocadies-recruiting-server` und
`ghcr.io/erilcemyilmaz/chocadies-recruiting-web`, jeweils mit den Tags
`<Commit-SHA>` und `latest`. Ausgerollt wird immer ueber den SHA-Tag, nie
ueber `latest`, damit jede Umgebung eindeutig einem Commit entspricht.

### CD (`.github/workflows/deploy.yml`)

1. **vorbereitung**: startet nach gruenem CI auf `main` (Push). Prueft, ob
   die Azure-Secrets gesetzt sind. Fehlen sie, wird das Deployment mit einem
   Hinweis in der Zusammenfassung uebersprungen, der Lauf bleibt gruen.
2. **staging**: rollt den SHA-Tag automatisch aus (Environment `staging`),
   danach Rauchtest auf `https://<web-fqdn>/health`.
3. **production**: gleiche Schritte im Environment `production`. Dieses
   Environment verlangt eine Freigabe, GitHub haelt den Job an, bis eine
   Pruefperson zustimmt.

Beide Umgebungen verwenden `.github/workflows/_deploy-umgebung.yml`.

## Noetige Secrets und Variablen

| Name | Art | Ebene | Zweck |
|---|---|---|---|
| `AZURE_CLIENT_ID` | Secret | Repository | App-Registrierung fuer OIDC-Anmeldung |
| `AZURE_TENANT_ID` | Secret | Repository | Azure-Mandant |
| `AZURE_SUBSCRIPTION_ID` | Secret | Repository | Azure-Abonnement |
| `MONGODB_URI` | Secret | Environment `staging` / `production` | Atlas-Verbindung, je Umgebung eigene Datenbank und eigener Benutzer |
| `JWT_SECRET` | Secret | Environment `staging` / `production` | Schluessel fuer die Zugriffstokens, je Umgebung verschieden, lang und zufaellig |
| `AZURE_RESOURCE_GROUP` | Variable | Environment | Ressourcengruppe |
| `CONTAINERAPP_SERVER` | Variable | Environment | Name der Container App der Server-App |
| `CONTAINERAPP_WEB` | Variable | Environment | Name der Container App der SPA |

`GITHUB_TOKEN` fuer den Push nach GHCR stellt GitHub selbst bereit.

## Einmalige Einrichtung (noch nicht erfolgt)

1. **Azure**: Ressourcengruppe und Container-Apps-Umgebung in
   Switzerland North, je Umgebung zwei Container Apps:
   - Server-App: Ingress **intern**, Zielport 3000.
   - SPA: Ingress **extern**, Zielport 80, HTTPS.
2. **GHCR-Zugriff fuer Azure**: Die Pakete sind privat. Einen GitHub-Token
   mit `read:packages` als Registry-Zugang hinterlegen:
   `az containerapp registry set -n <app> -g <rg> --server ghcr.io --username <github-user> --password <token>`.
3. **OIDC**: App-Registrierung in Entra ID mit Federated Credentials fuer
   `repo:ErilcemYilmaz/chocadies-recruiting:environment:staging` und
   `...:environment:production`, Rolle "Contributor" auf die
   Ressourcengruppe. Client-, Tenant- und Subscription-ID als Secrets
   eintragen (siehe Tabelle).
4. **GitHub Environments** `staging` und `production` anlegen, Secrets und
   Variablen eintragen, bei `production` "Required reviewers" setzen.
5. **MongoDB Atlas**: je Umgebung eigene Datenbank und eigener Benutzer, die
   ausgehenden IP-Adressen der Container-Apps-Umgebung in der Atlas
   IP Access List freigeben.
6. **Anmeldung der SPA**: Die Prototyp-Anmeldung funktioniert in den
   CI-Images bewusst nicht (keine Demo-Werte im Image). Fuer Staging und
   Produktion braucht es einen echten Anmeldedienst, siehe Uebergabe 4.3.

## Rollback

Jeder erfolgreiche Lauf auf `main` hinterlaesst unveraenderliche Images mit
dem Commit-SHA als Tag. Rollback = ein frueheres Tag erneut ausrollen:

1. Tag bestimmen: `git log --oneline main` oder GitHub > Packages >
   chocadies-recruiting-server > Versionen.
2. GitHub > Actions > **Deploy** > **Run workflow**, bei `image_tag` den
   vollen Commit-SHA eintragen.
3. Der Lauf rollt das Tag nach Staging aus und, nach Freigabe, nach
   Produktion.

Notfall ohne Pipeline (direkt in Azure):

```bash
az containerapp update -n <app> -g <rg> --image ghcr.io/erilcemyilmaz/chocadies-recruiting-server:<sha>
```

Alternativ in Azure Container Apps die vorherige Revision wieder aktivieren
(`az containerapp revision activate`), sofern der Revisionsmodus "multiple"
eingestellt ist.
