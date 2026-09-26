# tests

Postman-Collection `chocadies-recruiting.postman_collection.json` fuer die
API aus `api/openapi.yaml` (Kapitel 4.2.4). Deckt alle fuenf Operationen ab
sowie die Fehlerfaelle 400, 401, 403, 404, 409. Automatisierung mit Newman
folgt in der CI/CD-Pipeline (GitHub Actions, Kapitel 4.4).

## Manuell in Postman ausfuehren

1. Collection in Postman importieren (Datei > Import).
2. Server lokal starten: im Ordner `server` `npm run dev` (setzt eine
   funktionierende `.env` mit `MONGODB_URI` und `JWT_SECRET` voraus, siehe
   README.md im Hauptordner).
3. Test-Tokens erzeugen: im Ordner `server` `npm run token:intern` bzw.
   `npm run token:vermittler -- firma-a` ausfuehren und die ausgegebenen
   Tokens in die Collection-Variablen `internToken` bzw. `vermittlerToken`
   eintragen (Collection > Variables).
4. Collection mit "Run" der Reihe nach ausfuehren. Test 02 legt eine
   Bewerbung an und setzt `bewerbungId` automatisch fuer die folgenden
   Requests.

## Mit Newman von der Kommandozeile

```bash
npm install -g newman
newman run tests/chocadies-recruiting.postman_collection.json \
  --env-var baseUrl=http://localhost:3000/v1 \
  --env-var internToken=<token aus npm run token:intern> \
  --env-var vermittlerToken=<token aus npm run token:vermittler>
```

## Bereits automatisiert verifiziert

`server/tests/newman-smoke.test.ts` (Teil der Vitest-Suite, `npm run
test:newman` im Ordner server) startet die Basis-Applikation mit einem
In-Memory-Ersatz fuer die Datenbank und fuehrt dieselbe Collection per
Newman dagegen aus. Damit ist sichergestellt, dass Collection und API
tatsaechlich zusammenpassen, unabhaengig von einer echten
MongoDB-Verbindung.

## Abnahme gegen MongoDB Atlas

Am 23.09.2026 mit `npm run dev` gegen den echten Atlas-Cluster (M0,
Frankfurt) und der Newman-Ausfuehrung oben: 12/12 Requests, 20/20
Assertions erfolgreich. Die Collection raeumt ihre Testdaten selbst auf
(Request 11 loescht die angelegte Bewerbung).

## Manueller Systemtest (Kapitel 4.4.3)

Testprotokoll: `systemtest-4.4.3.md` (ausgefuehrt am 26.09.2026, automatisiert
mit `web/e2e/systemtest.spec.ts`, Screenshots in `docs/systemtest/`). Testdaten dazu im
Ordner `server`: `npm run testdaten:anlegen` bzw. `npm run testdaten:entfernen`.
