# MongoDB Atlas Setup (Schritt 6, Teil A)

Protokoll der Cluster-Erstellung fuer `chocadies-recruiting`. Region gemaess
Vorgabe: Frankfurt (eu-central-1), Tarif M0 (kostenlos).

## Ablauf

1. Konto auf https://www.mongodb.com/cloud/atlas/register erstellen (eigene
   Zugangsdaten, nicht von Dritten ausfuellen lassen).
2. Neues Projekt anlegen, z. B. `chocadies-recruiting`.
3. Cluster erstellen: Tarif **M0 Free**, Anbieter beliebig, Region
   **Frankfurt (eu-central-1)**.
4. Datenbankbenutzer anlegen (Username/Passwort-Authentifizierung), Passwort
   in einem Passwortmanager sichern, nicht im Repository ablegen.
5. Netzwerkzugriff: fuer die lokale Entwicklung entweder die eigene IP
   freigeben oder (nur fuer die Testphase) `0.0.0.0/0` mit Hinweis in der
   Sicherheitsbetrachtung der Arbeit.
6. "Connect" -> "Drivers" -> Node.js, Verbindungsstring kopieren.
7. Verbindungsstring lokal in `server/.env` als `MONGODB_URI` eintragen
   (Aufbau siehe README.md, Abschnitt "Server lokal starten"). Platzhalter
   `<benutzer>`, `<passwort>` und `<cluster-url>` ersetzen, Datenbankname
   `chocadies-recruiting` ergaenzen.
8. Verbindung testen: im Ordner `server` `npm install` und danach
   `npm run db:test` ausfuehren.

## Status

| Datum | Schritt | Ergebnis |
|---|---|---|
| 2026-08-18 | Konto, M0-Cluster (Frankfurt) und Datenbankbenutzer angelegt | erledigt |
| 2026-08-18 | Verbindungsstring in `server/.env` eingetragen | erledigt |
| 2026-08-18 | `npm install` / `npm run db:test` | erfolgreich, Ping-Antwort `{ ok: 1 }` |

## Sicherheitshinweis

Der Verbindungsstring enthaelt das Datenbankpasswort. Er gehoert
ausschliesslich in die lokale `.env` (per `.gitignore` von Git
ausgeschlossen), niemals in den Quellcode, die OpenAPI-Spezifikation oder
die schriftliche Arbeit selbst. Fuer die Deployment-Dokumentation genuegt ein
maskierter Auszug (z. B. `mongodb+srv://***:***@cluster0.xxxxx.mongodb.net/...`).
