# CLAUDE.md

Regeln fuer Claude Code in diesem Repository (APDE-Transferaufgabe,
Personalgewinnungsplattform der Chocolatier Chocadies AG).

## Rollenteilung

- **Claude Code (hier):** nur Code und technische Artefakte: `server/`,
  `web/`, `api/openapi.yaml`, Diagramme (`docs/*.puml`), Postman-Collection,
  Docker, GitHub Actions, technische READMEs.
- **Claude-Projekt (claude.ai):** der Fliesstext der schriftlichen Arbeit
  (Begruendungen, Zitate, Verzeichnisse, KI-Deklaration). Hier keinen
  Fliesstext fuer die Arbeit schreiben und keine `.docx` erzeugen oder
  committen.

## Nach jedem Arbeitsblock

1. Tests laufen lassen (`cd server && npm test && npm run test:newman && npm run build`)
   und das tatsaechliche Ergebnis festhalten, nicht das erwartete.
2. Uebergabe-Datei `docs/uebergabe/JJJJ-MM-TT_<kapitel>-<thema>.md` nach
   `docs/uebergabe/_vorlage.md` schreiben. Sie ist die einzige Quelle, aus der
   das Claude-Projekt technische Fakten uebernimmt, also nur Belegbares.
3. Eintrag in `docs/ki-protokoll.md`, Werkzeug `Claude Code`.
4. Commits erst auf Anweisung, thematisch getrennt, Conventional Commits auf
   Deutsch (`feat(server): ...`, `docs: ...`, `test: ...`).

## Fixe Vorgaben

- Technologieentscheidungen stehen in `docs/APDE_Entscheidungen_und_Setup.md`
  und werden nicht eigenmaechtig geaendert (TypeScript, Node 22, Express,
  MongoDB/Mongoose, React/Vite, OpenAPI 3.1, Vitest, Postman/Newman, Docker,
  GitHub Actions).
- Einziges Datenobjekt der Web-API ist `Bewerbung`. `api/openapi.yaml` ist
  der Vertrag: Code, Zod-Schemas und Postman-Collection muessen dazu passen.
- Schichten gemaess `docs/architektur_komponenten.puml`: Routen -> Middleware
  (Auth, Validierung) -> Controller -> Repository (Data-Access-Layer) -> Mongoose.
- Bezeichner und Kommentare auf Deutsch, ohne Umlaute im Code (ae/oe/ue).
- Secrets nie ins Repo: `server/.env` und `server/.env.example` sind lokal
  und per `.gitignore` ausgeschlossen. Benoetigte Variablen stehen im README.
- Entwicklung unter Windows: Skripte und Tests muessen dort laufen.

## Kapitelzuordnung

| Kapitel | Inhalt | Ort |
|---|---|---|
| 4.1 | Architektur, API-Spezifikation | `docs/`, `api/` |
| 4.2 | Server-App, Data-Access-Layer, API-Tests | `server/`, `tests/` |
| 4.3 | SPA Web-App | `web/` |
| 4.4 | Deployment, CI/CD | `Dockerfile`, `.github/workflows/` |
