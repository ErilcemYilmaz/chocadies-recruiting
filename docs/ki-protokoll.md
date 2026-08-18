# KI-Protokoll

Laufendes Protokoll der Claude-Nutzung fuer die APDE-Transferaufgabe
(Grundlage fuer die KI-Deklaration vom 29.08.2026). Bitte ab jedem
Arbeitsblock ergaenzen, nicht nachtraeglich rekonstruieren.

| Datum | Werkzeug | Zweck / Prompt (Kurzfassung) | Ergebnis / Uebernahme |
|---|---|---|---|
| 2026-08-18 | Claude (Cowork) | MongoDB-Setup: Ordnerstruktur des Repos angelegt, Mongoose-Schema und Data-Access-Layer fuer das Datenobjekt Bewerbung erstellt (passend zu api/openapi.yaml und architektur_komponenten.puml), Verbindungs-Testskript geschrieben, Anleitung fuer MongoDB Atlas M0 (Region Frankfurt) erstellt. | Code in server/src (config, models, repositories) und scripts/testConnection.ts vollstaendig uebernommen, vor Verwendung durchgelesen und Feldnamen gegen openapi.yaml geprueft. |
| 2026-08-18 | Claude (Cowork) | Fehlersuche beim ersten Verbindungstest (fehlende .env, danach bad auth). | Ursachen selbst identifiziert und behoben: .env.txt zu .env umbenannt, Datenbankbenutzer-Passwort in Atlas neu gesetzt. Claude hat keine Zugangsdaten gesehen oder eingegeben. Verbindungstest danach erfolgreich (Ping-Antwort { ok: 1 }). |
