# APDE Transferaufgabe: Entscheidungsgrundlage 4.1 und Setup

Stand: 17.08.2026. Diese Entscheidungen sind ab jetzt fix. Jede spätere Änderung kostet dich Tage, die du nicht hast.

---

## Teil A: Setup heute (rund 90 Minuten)

| # | Schritt | Woher | Prüfen mit |
|---|---|---|---|
| 1 | Node.js 22 LTS installieren | nodejs.org | `node -v` und `npm -v` |
| 2 | Git installieren | git-scm.com | `git --version` |
| 3 | VS Code installieren | code.visualstudio.com | startet |
| 4 | Claude Code einrichten | im VS Code Marketplace | Testprompt läuft |
| 5 | GitHub-Konto, privates Repository `chocadies-recruiting` anlegen | github.com | erster Commit |
| 6 | MongoDB Atlas M0 (kostenlos) anlegen, Region Frankfurt | mongodb.com/atlas | Verbindungsstring notiert |
| 7 | Postman installieren | postman.com | startet |
| 8 | Figma-Konto (kostenlos) | figma.com | leere Datei angelegt |

MongoDB nimmst du bewusst als gehosteten Dienst statt lokal. Das spart dir heute die Installation, du bekommst einen echten Verbindungsstring für die Deployment-Dokumentation, und es passt fachlich zur Situation der CAG mit acht Informatikstellen.

Ordnerstruktur im Repository:

```
/server     Server-App (Kapitel 4.2)
/web        SPA Web-App (Kapitel 4.3)
/api        openapi.yaml (Kapitel 4.1)
/docs       Diagramme, Print-Screens, Arbeitsprotokolle
/tests      Postman-Collection
```

Lege heute noch eine Datei `docs/ki-protokoll.md` an und trage ab dem ersten Prompt mit, wofür du Claude einsetzt. Daraus wird am 29.08. die KI-Deklaration. Nachträglich rekonstruieren funktioniert nicht.

---

## Teil B: Fixierte Technologie-Entscheidungen

**Datenobjekt der Web-API: `Bewerbung`.** Nur dieses eine, wie die Aufgabenstellung es vorschreibt. Felder: `id`, `nachname`, `vorname`, `email`, `stelle`, `standort` (Lenzburg oder Nancy), `sprache` (de oder fr), `status`, `eingangsdatum`, `dokumente`.

| Aspekt | Entscheidung | Kernargument für Chocadies |
|---|---|---|
| Sprache | TypeScript, server- und clientseitig | Acht Informatikstellen auf 1'100 Mitarbeitende. Eine Sprache über alle Schichten senkt Einarbeitungs- und Wartungsaufwand |
| Laufzeitumgebung Server | Node.js 22 LTS | Langzeitunterstützung, planbarer Wartungszyklus bei knapper Personaldecke |
| Middleware / Framework | Express | Schlank, standardnah, grosser Talentpool. Antwort auf die Rekrutierungsprobleme nach dem Abgang des Administrators |
| Datenbank | MongoDB (Non-SQL, wie in 4.2 gefordert) | Bewerbungsdossiers und LinkedIn-Importe haben unterschiedliche Feldstrukturen, ein flexibles Schema vermeidet ständige Migrationen |
| Persistenzschicht | Mongoose als Data-Access-Layer | Erfüllt die Vorgabe eines eigenen Data-Access-Layers aus 4.2.2 |
| Client SPA | React mit Vite | |
| Mobile (nur Wireframe) | React Native | Gemeinsame Codebasis mit der SPA, kein zweites Team nötig |
| API-Stil | REST | |
| API-Spezifikation | OpenAPI 3.1 in YAML | Maschinenlesbar wie gefordert, Grundlage für die eigene API für Personalvermittlungsfirmen |
| API-Dokumentationstool | Swagger Editor, Darstellung mit Redoc | |
| API-Testing | Postman, Automatisierung mit Newman | Newman läuft später in der Pipeline aus 4.4.1 |
| Unit-Testing | Vitest | |
| UI-Wireframing | Figma | |
| IDE | Visual Studio Code | |
| KI-Unterstützung | Claude Code in VS Code | |
| Versionskontrolle | Git mit GitHub | |
| Diagrammnotation | UML Komponentendiagramm und Paketdiagramm | Die Bewertungskriterien nennen wörtlich Pakete, Komponenten, Assoziationen und Interfaces |
| Diagrammwerkzeug | draw.io oder PlantUML | Selbst erstellt, damit «Eigene Darstellung» zulässig ist |
| Containerisierung | Docker | |
| CI/CD | GitHub Actions | |

---

## Teil C: Quellenbasis, frei zugänglich und seitengenau zitierbar

Zu jeder Auswahlentscheidung mindestens eine buchartige oder normative Quelle plus eine Internetquelle, wie die Aufgabenstellung es verlangt. Alle Einträge sind kostenlos erreichbar. Trage beim Zitieren die tatsächlich gelesene Seite ein und ergänze bei Webseiten das Abrufdatum, wie es der Zitierleitfaden vorschreibt.

### Softwarearchitektur und Diagrammwahl

- Object Management Group [OMG]. (2017). *Unified Modeling Language (UML), Version 2.5.1*. https://www.omg.org/spec/UML/2.5.1/
  → Normative Primärquelle. Kapitel 11 behandelt strukturierte Klassifizierer, Komponenten und Ports, Kapitel 12 die Pakete. Seitengenau zitierbar aus dem PDF.
- Chen, L. (2018). Microservices: Architecting for Continuous Delivery and DevOps. *IEEE International Conference on Software Architecture*. Frei über die Autorenseite verfügbar.

### REST und API-Design

- Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* [Dissertation, University of California, Irvine]. https://ics.uci.edu/~fielding/pubs/dissertation/top.htm
  → Die Originalquelle zu REST, Kapitel 5. Wer REST wählt und Fielding zitiert, zeigt, dass er die Herleitung kennt und nicht nur ein Tutorial gelesen hat.
- OpenAPI Initiative. (2024). *OpenAPI Specification v3.1.1*. https://spec.openapis.org/oas/v3.1.1.html

### Persistenz und Datenmodellierung

- MongoDB Inc. (o. J.). *Data Modeling Introduction*. MongoDB Manual. https://www.mongodb.com/docs/manual/data-modeling/
- Sadalage, P. & Fowler, M. (2012). *NoSQL Distilled*. Addison-Wesley.
  → Kostenpflichtig, aber das Kapitel zu Aggregatorientierung ist in Vorschauen zugänglich. Nur zitieren, wenn du die Seite tatsächlich siehst.

### Deployment, CI/CD und Betrieb

- Beyer, B., Jones, C., Petoff, J. & Murphy, N. R. (2016). *Site Reliability Engineering: How Google Runs Production Systems*. O'Reilly. Frei lesbar unter https://sre.google/sre-book/table-of-contents/
  → Ein echtes Fachbuch, vollständig kostenlos, mit Kapitelnummern. Kapitel 8 zu Release Engineering trägt deine Begründung für die Pipeline.
- DORA / Google Cloud. (2024). *Accelerate State of DevOps Report*. https://dora.dev/research/

### Sicherheit und Datenschutz

- Bundesamt für Cybersicherheit [BACS]. (2022). *Merkblatt Informationssicherheit für KMUs*. Bern.
- OWASP Foundation. (2023). *OWASP API Security Top 10*. https://owasp.org/API-Security/
- *Bundesgesetz über den Datenschutz* [DSG] vom 25. September 2020, SR 235.1. https://www.fedlex.admin.ch/eli/cc/2022/491/de
- Verordnung (EU) 2016/679 [DSGVO]. https://eur-lex.europa.eu/eli/reg/2016/679/oj

### UI, UX und Plattformvorgaben

- Nielsen, J. (1994). *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/
- Apple Inc. (o. J.). *Human Interface Guidelines*. https://developer.apple.com/design/human-interface-guidelines
- Google. (o. J.). *Material Design 3*. https://m3.material.io/
- World Wide Web Consortium [W3C]. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/

### Store-Deployment

- Apple Inc. (2026). *Upcoming Requirements*. https://developer.apple.com/news/upcoming-requirements/
- Apple Inc. (o. J.). *App Review Guidelines*. https://developer.apple.com/app-store/review/guidelines/
- Google. (2026). *Target API level requirements for Google Play apps*. https://support.google.com/googleplay/android-developer/answer/11926878

### Firmenquelle

- WISS Schulen für Wirtschaft Informatik Immobilien AG. (o. J.). *Trainingsfirma Chocolatier Chocadies AG* (Version 2.0), [PDF-Dokument]. Zürich.

---

## Teil D: Zitierregeln, die dich sonst Punkte kosten

- Kurzbeleg immer in der Form (Nachname, Jahr, Seite), auch bei Paraphrasen.
- Der Beleg steht unmittelbar hinter der belegten Aussage, niemals gesammelt am Absatzende.
- Direkte Zitate sparsam und in « ».
- Bei Organisationen der volle Name beim ersten Beleg, Abkürzung in Klammern, danach nur die Abkürzung.
- Webseiten, die sich ändern können, mit «Abgerufen am 17.08.2026, von …» im Literaturverzeichnis.
- Abbildungen und Tabellen fortlaufend nummeriert, Beschriftung unterhalb, mit Punkt am Schluss, im Text referenziert als «Abbildung 1 zeigt …».
- Selbst gezeichnete Diagramme: «(Eigene Darstellung, 2026).» Von Claude erzeugte Diagramme: «(KI-generiert, Claude, 2026).» Beides gehört ins Abbildungsverzeichnis.
- Separate Verzeichnisse für Abbildungen und Tabellen.
- Alles grösser als eine halbe Seite gehört in den Anhang.
