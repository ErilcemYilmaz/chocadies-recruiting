# tests

Postman-Collection `chocadies-recruiting.postman_collection.json` fuer die
API aus `api/openapi.yaml`. Deckt alle fuenf Operationen ab sowie die
Fehlerfaelle 400, 401, 403, 404, 409. In der CI-Pipeline laeuft sie
automatisch per Newman (`npm run test:newman` im Ordner `server`).

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

## Automatisiert ohne Datenbank

`server/tests/newman-smoke.test.ts` (`npm run test:newman` im Ordner
`server`) startet die Server-App mit einem In-Memory-Ersatz fuer die
Datenbank und fuehrt dieselbe Collection per Newman dagegen aus. Die
Collection raeumt ihre Testdaten selbst auf (Request 11 loescht die
angelegte Bewerbung).
