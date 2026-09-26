# Systemtest SPA-Prototyp (Kapitel 4.4.3)

Testprotokoll. Durchgefuehrt am 26.09.2026 mit Claude Code: Die Testfaelle
wurden als Playwright-Test (`web/e2e/systemtest.spec.ts`) umgesetzt und in
Chrome gegen die laufenden Container ausgefuehrt. Jeder Testfall legt einen
Screenshot ab. Der Test ist jederzeit wiederholbar (`cd web && npm run test:e2e`). Getestet werden die vier Basisfaelle
**neu, suchen, aendern, loeschen** der SPA aus Sicht der Sachbearbeitung,
je mit Normalfall und Fehler- bzw. Randfaellen. Die erwarteten Ergebnisse
beschreiben, was eine Sachbearbeiterin fachlich erwartet, nicht was der Code
heute tut. Abweichungen sind deshalb Befunde.

## 1. Vorbereitung

1. Testdaten anlegen (24 fiktive Bewerbungen, Domain `testdaten.example`):
   ```bash
   cd server
   npm run testdaten:anlegen
   ```
2. Frisches Token erzeugen und in `web/.env.local` bei `VITE_API_TOKEN`
   eintragen (8 h gueltig): `npm run token:intern`
3. Anwendung starten, bevorzugt als Container (entspricht dem Deployment):
   ```bash
   docker compose --env-file web/.env.local up --build
   ```
   SPA: http://localhost:8080 (alternativ `npm run dev` in server und web,
   dann http://localhost:5173)
4. Chrome, Fensterbreite 1440 px, Sprache DE. Anmelden mit dem Demo-Konto
   aus `web/.env.local`.
5. Screenshots unter `docs/systemtest/TF-xx.png` ablegen.
6. Automatisiert: `cd web && npm run test:e2e` (Screenshots nach
   `docs/systemtest/`, fuer den Retest mit `E2E_SCREENSHOTS=../docs/systemtest/retest`).

Nach dem Test: `npm run testdaten:entfernen` (entfernt nur Datensaetze mit
`@testdaten.example`, auch die im Test neu erfassten).

## 2. Testumgebung

| Angabe | Wert |
|---|---|
| Datum | 26.09.2026 |
| Ausfuehrung | Claude Code, automatisiert mit Playwright 1.63 (`web/e2e/systemtest.spec.ts`) |
| Stand Lauf 1 | Commit `83f12a9` |
| Stand Retest | Commit `83f12a9` plus Korrekturen B-1 bis B-3 (siehe Abschnitt 4) |
| Start | `docker compose --env-file web/.env.local up --build`, SPA auf http://localhost:8080 |
| Browser, Version | Google Chrome 153.0.8010.54, Fenster 1440 x 1024 (TF-14: 390 x 844) |
| Datenbank | MongoDB Atlas M0 (Frankfurt), vor jedem Lauf `npm run testdaten:anlegen` (24 Testdatensaetze + 1 bestehende Bewerbung) |

## 3. Testfaelle

Status: **OK** = wie erwartet, **F** = Fehler (Befund in Abschnitt 4
eintragen), **E** = Einschraenkung (funktioniert, aber verbesserungswuerdig).
Spalte "Tatsaechliches Ergebnis" = Lauf 1; Retest siehe Abschnitt 4.
Screenshots Lauf 1: `docs/systemtest/`, Retest: `docs/systemtest/retest/`.

### Basisfall 1: Neu erfassen

| ID | Vorbedingung | Schritte | Erwartetes Ergebnis | Tatsaechliches Ergebnis | Status | Screenshot |
|---|---|---|---|---|---|---|
| TF-01 | angemeldet, Uebersicht | "Neue Bewerbung" → Nachname `Beispiel`, Vorname `Nora`, E-Mail `nora.beispiel@testdaten.example`, Telefon `+41 79 111 22 33`, Stelle `Chocolatière`, Standort `Lenzburg`, Sprache Franzoesisch, Datei `Lebenslauf_Beispiel.pdf` hineinziehen, Bemerkung eingeben → "Speichern" | Wechsel in die Detailansicht mit Meldung "Die Bewerbung wurde erfasst.", alle Angaben korrekt, Status "Eingegangen", Eingangsdatum heute, Dokument mit Typ "Lebenslauf" | Wie erwartet: Detailansicht Nora Beispiel mit Erfolgsmeldung, Status Eingegangen, Eingangsdatum 26.09.2026, Sprache Franzoesisch, Dokument Lebenslauf_Beispiel.pdf (Typ Lebenslauf) | OK | TF-01.png |
| TF-02 | Formular "Neue Bewerbung" leer | Nur E-Mail `nora.beispiel` eingeben → "Speichern" | Nichts wird gespeichert; rote Hinweise direkt bei Nachname, Vorname, Stelle, Standort ("Bitte …") und bei E-Mail "Bitte gueltige E-Mail-Adresse eingeben."; Cursor steht im ersten fehlerhaften Feld | **Abweichung:** Nur die E-Mail wird rot markiert, Nachname, Vorname, Stelle und Standort nicht; der Klick auf Speichern hat das Formular nicht geprueft | F (B-1) | TF-02.png |
| TF-03 | Bewerbung Sophie Meier (Verkaufsleiterin, offen) existiert | Neue Bewerbung mit E-Mail `sophie.meier@testdaten.example`, Stelle `Verkaufsleiterin`, uebrige Pflichtfelder gueltig → "Speichern" | Gelbe Warnung oben "Fuer diese E-Mail und Stelle besteht bereits eine offene Bewerbung.", Eingaben bleiben erhalten, kein zweiter Datensatz | Wie erwartet: gelbe Warnung, Eingaben bleiben erhalten, kein zweiter Datensatz | OK | TF-03.png |

### Basisfall 2: Suchen

| ID | Vorbedingung | Schritte | Erwartetes Ergebnis | Tatsaechliches Ergebnis | Status | Screenshot |
|---|---|---|---|---|---|---|
| TF-04 | Uebersicht, keine Filter | Suche `Rochat` | genau 1 Treffer: Claudine Rochat, Konditorin, Filiale Schweiz | Wie erwartet: 1 Treffer Claudine Rochat, Konditorin, Filiale Schweiz | OK | TF-04.png |
| TF-05 | Uebersicht, keine Filter | Suche `Roch` (Wortanfang) | Claudine Rochat erscheint (Suche nach Namensanfang, wie der Platzhalter "Name oder Stelle suchen..." nahelegt) | **Abweichung:** "Keine Bewerbungen gefunden." - die Suche findet nur ganze Woerter | F (B-2) | TF-05.png |
| TF-06 | Uebersicht | Status "In Pruefung" und Standort "Lenzburg" waehlen, danach "Filter zuruecksetzen" | 3 Treffer (Luca Bernasconi, Sarah Frei, Reto Baumann); nach Zuruecksetzen wieder alle Bewerbungen | Wie erwartet: 3 Treffer (Bernasconi, Frei, Baumann); nach Zuruecksetzen 20 Zeilen, Seite 1 von 2 | OK | TF-06.png |
| TF-07 | Uebersicht, keine Filter | Fuss der Tabelle ansehen, "Weiter", dann "Zurueck" | Anzahl Bewerbungen und "Seite 1 von 2"; "Weiter" zeigt die restlichen Eintraege auf Seite 2; "Zurueck" auf Seite 1 deaktiviert | Wie erwartet: Seite 1 von 2, Zurueck deaktiviert; Seite 2 mit den restlichen Eintraegen, Weiter deaktiviert | OK | TF-07.png |

### Basisfall 3: Aendern

| ID | Vorbedingung | Schritte | Erwartetes Ergebnis | Tatsaechliches Ergebnis | Status | Screenshot |
|---|---|---|---|---|---|---|
| TF-08 | Detail Nadine Schwarz (In Pruefung) | "Bearbeiten" → Status "Zum Gespraech eingeladen", Bemerkung `Gespraech am 05.10.` → "Aenderungen speichern" → zurueck zur Uebersicht | Meldung "Aenderungen gespeichert"; "Zuletzt geaendert am" = heute; in Detail und Uebersicht neuer Status und neue Bemerkung | Wie erwartet: Meldung, "Zuletzt geaendert am 26.09.2026", Status und Bemerkung in Detail und Uebersicht aktualisiert | OK | TF-08.png |
| TF-09 | Detail Sophie Meier (mit Telefon) | "Bearbeiten" → Telefonnummer vollstaendig loeschen → "Aenderungen speichern" → Detail neu laden | Telefon ist leer ("–") | **Abweichung:** Meldung "Aenderungen gespeichert", nach dem Neuladen steht aber weiterhin +41 79 123 45 67 | F (B-3) | TF-09.png |
| TF-10 | Bearbeiten Marcel Fontaine | E-Mail-Feld leeren → "Aenderungen speichern" | Nichts wird gespeichert, Hinweis beim Feld E-Mail; nach "Abbrechen" ist die alte E-Mail unveraendert | Wie erwartet: Hinweis "Bitte dieses Feld ausfuellen." bei E-Mail, nichts gespeichert, nach Abbrechen alte E-Mail unveraendert | OK | TF-10.png |

### Basisfall 4: Loeschen

| ID | Vorbedingung | Schritte | Erwartetes Ergebnis | Tatsaechliches Ergebnis | Status | Screenshot |
|---|---|---|---|---|---|---|
| TF-11 | Detail Nora Beispiel (aus TF-01) | "Loeschen" → Dialog mit Taste Escape schliessen | Dialog "Bewerbung loeschen?" nennt den Namen; nach Escape ist nichts geloescht, Fokus wieder auf "Loeschen" | Wie erwartet: Dialog nennt Nora Beispiel, Escape schliesst, Fokus auf Loeschen, Bewerbung vorhanden | OK | TF-11.png |
| TF-12 | Detail Nora Beispiel | "Loeschen" → "Endgueltig loeschen" → danach Adresse der alten Detailseite erneut aufrufen | Wechsel zur Uebersicht mit "Die Bewerbung wurde geloescht.", Nora Beispiel nicht mehr in der Liste; alte Adresse zeigt "Diese Bewerbung existiert nicht oder wurde geloescht." | Wie erwartet: Meldung "Die Bewerbung wurde geloescht.", nicht mehr in der Liste; alte Adresse zeigt "Diese Bewerbung existiert nicht oder wurde geloescht." (TF-12b.png) | OK | TF-12.png |

### Optional: Querschnitt

| ID | Vorbedingung | Schritte | Erwartetes Ergebnis | Tatsaechliches Ergebnis | Status | Screenshot |
|---|---|---|---|---|---|---|
| TF-13 | Uebersicht | In der Seitenleiste "FR" | Oberflaeche, Status- und Standortnamen auf Franzoesisch; Daten unveraendert | Wie erwartet: Oberflaeche franzoesisch, "En examen", "Filiale Suisse" | OK | TF-13.png |
| TF-14 | Uebersicht | DevTools, Geraet 390 × 844, Filter Status setzen | Kopfzeile mit Menue und "+", Schaltflaeche "Filter" mit Zaehler, Karten statt Tabelle | Wie erwartet: Kopfzeile mit Menue und +, "Filter" mit Zaehler 1, Karten statt Tabelle | OK | TF-14.png |

## 4. Befunde

| Nr. | Testfall | Beschreibung | Schwere (hoch/mittel/tief) | Ursache (nach Analyse) | Korrektur | Retest |
|---|---|---|---|---|---|---|
| B-1 | TF-02 | Nach einer Eingabe mit Feldfehler geht der erste Klick auf "Speichern" verloren; die leeren Pflichtfelder werden nicht gemeldet | mittel | Beim Druecken der Maustaste verlaesst der Fokus das Feld, die Fehlermeldung darunter erscheint und schiebt die Knoepfe nach unten; beim Loslassen liegt der Zeiger nicht mehr auf dem Knopf. Der Komponententest (jsdom, ohne Layout) konnte das nicht zeigen | `web/src/komponenten/formular/BewerbungFormular.tsx`: Mausdruck auf Speichern/Abbrechen nimmt dem Feld den Fokus nicht mehr (`preventDefault` auf `mousedown`); Tastaturbedienung unveraendert. Neuer Komponententest | OK (retest/TF-02.png) |
| B-2 | TF-05 | Suche findet nur ganze Woerter ("Roch" findet "Rochat" nicht) | mittel | Server nutzte die MongoDB-Volltextsuche (`$text`), die nur ganze Woerter vergleicht | `server/src/repositories/suchfilter.ts`: Suche nach Wortanfaengen in Nachname, Vorname, Stelle, ohne Gross-/Kleinschreibung, Eingabe maskiert (kein Einschleusen regulaerer Ausdruecke); Beschreibung in `api/openapi.yaml` angepasst. 5 neue Unit-Tests | OK (retest/TF-05.png) |
| B-3 | TF-09 | Eine erfasste Telefonnummer laesst sich nicht entfernen, obwohl "Aenderungen gespeichert" erscheint | mittel (falsche Daten bleiben gespeichert; Recht auf Berichtigung nach DSG) | Die SPA laesst leere optionale Felder im PUT weg; der Server liess fehlende Felder unveraendert, statt sie zu ersetzen | `server/src/controllers/bewerbung.controller.ts` und Repository: Fehlen `telefon` oder `bemerkung` im PUT, werden sie entfernt (`$unset`), wie es die Spezifikation fuer PUT ("ersetzt") verlangt; `api/openapi.yaml` praezisiert. Neuer Unit-Test | OK (retest/TF-09.png) |

**Retest** (26.09.2026, nach den Korrekturen, Container neu gebaut, Testdaten
neu angelegt): 14 von 14 Testfaellen OK. Unit-Tests danach: Server 26/26,
Web 13/13, Newman gruen.

Hinweis zur Durchfuehrung: Beim ersten Ausfuehren schlugen zusaetzlich TF-07
und TF-10 fehl. Ursache war das Testskript, nicht die Anwendung ("Zurueck"
traf auch "Filter zuruecksetzen"; ein Selektor fand zwei Listen). Das Skript
wurde korrigiert, bevor Lauf 1 gewertet wurde.

## 5. Verbesserungsvorschlaege

| Nr. | Vorschlag | Nutzen | Aufwand |
|---|---|---|---|
| V-1 | Echter Datei-Upload mit Dokumentenspeicher statt nur Metadaten | Dokumente sind heute nicht abrufbar (Links fuehren ins Leere) | hoch (Speicher, Endpunkt, Virenpruefung) |
| V-2 | Anmeldung ueber einen echten Anmeldedienst (z.B. Microsoft Entra ID) statt Demo-Konto | Voraussetzung fuer Staging/Produktion; Rollen aus dem Firmenverzeichnis | mittel |
| V-3 | Rueckfrage beim Verlassen eines Formulars mit ungespeicherten Aenderungen | verhindert Datenverlust bei "Abbrechen" oder Navigation | tief |
| V-4 | Statusverlauf in der Detailansicht anzeigen (heute nur gespeichert) | Nachvollziehbarkeit, Auskunftspflicht DSG/DSGVO | mittel (neuer Lese-Endpunkt) |
| V-5 | Systemtest (`npm run test:e2e`) in der CI-Pipeline gegen die Container des Jobs "container" ausfuehren | Regressionen wie B-1 bis B-3 fallen vor dem Ausrollen auf | tief |

## 6. Zusammenfassung

| Lauf | Testfaelle | OK | F | E | nicht durchgefuehrt |
|---|---|---|---|---|---|
| Lauf 1 | 14 | 11 | 3 (TF-02, TF-05, TF-09) | 0 | 0 |
| Retest nach Korrektur | 14 | 14 | 0 | 0 | 0 |

Alle vier Basisfaelle (neu, suchen, aendern, loeschen) funktionieren nach
den Korrekturen wie fachlich erwartet.
