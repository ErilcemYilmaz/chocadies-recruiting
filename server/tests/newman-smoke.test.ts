import { describe, it, expect, vi } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import type { AddressInfo } from 'node:net';

const execFileAsync = promisify(execFile);

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/test';

/**
 * NICHT Teil der Abgabe-Dokumentation: interner Verifikationstest, der die
 * echte Postman-Collection (tests/chocadies-recruiting.postman_collection.json)
 * per Newman gegen die Basis-Applikation laufen laesst. Die Persistenz wird
 * wie in tests/api.test.ts gemockt, damit dieser Test ohne echten
 * MongoDB-Zugriff durchlaeuft. Dient nur dazu, vor der Abgabe zu pruefen,
 * dass Collection und API tatsaechlich zusammenpassen.
 */
vi.mock('../src/repositories/bewerbung.repository.js', () => {
  const store = new Map<string, Record<string, unknown>>();
  let counter = 0;
  return {
    bewerbungRepository: {
      anlegen: vi.fn(async (daten: Record<string, unknown>) => {
        counter += 1;
        const id = counter.toString().padStart(24, '0');
        const doc = { id, status: 'eingegangen', dokumente: [], eingangsdatum: new Date(), ...daten };
        store.set(id, doc);
        return doc;
      }),
      findenNachId: vi.fn(async (id: string) => store.get(id) ?? null),
      suchen: vi.fn(async (opts: Record<string, unknown>) => {
        let treffer = Array.from(store.values());
        if (opts.vermittlerId) treffer = treffer.filter((b) => b.vermittlerId === opts.vermittlerId);
        if (opts.status) treffer = treffer.filter((b) => b.status === opts.status);
        if (opts.standort) treffer = treffer.filter((b) => b.standort === opts.standort);
        return { treffer, seite: opts.seite ?? 1, proSeite: opts.proSeite ?? 20, gesamt: treffer.length };
      }),
      aendern: vi.fn(async (id: string, daten: Record<string, unknown>) => {
        const bestehend = store.get(id);
        if (!bestehend) return null;
        const geaendert = { ...bestehend, ...daten, aenderungsdatum: new Date() };
        store.set(id, geaendert);
        return geaendert;
      }),
      loeschen: vi.fn(async (id: string) => store.delete(id)),
      offeneBewerbungExistiert: vi.fn(
        async (email: string, stelle: string) =>
          Array.from(store.values()).some(
            (b) => b.email === email && b.stelle === stelle && b.status !== 'abgelehnt' && b.status !== 'eingestellt',
          ),
      ),
    },
  };
});

describe('Newman-Verifikation der Postman-Collection', () => {
  it(
    'alle Requests der Collection laufen gegen die Basis-Applikation gruen durch',
    async () => {
      const { buildApp } = await import('../src/app.js');
      const app = buildApp();
      const server = app.listen(0);
      const { port } = server.address() as AddressInfo;

      const secret = process.env.JWT_SECRET as string;
      const internToken = jwt.sign({ sub: 'intern:smoke', scope: 'intern' }, secret, { expiresIn: '1h' });
      const vermittlerToken = jwt.sign(
        { sub: 'vermittler:firma-a', scope: 'personalvermittlung', firmaId: 'firma-a' },
        secret,
        { expiresIn: '1h' },
      );

      const collection = path.resolve(__dirname, '../../tests/chocadies-recruiting.postman_collection.json');

      try {
        const { stdout } = await execFileAsync(
          'npx',
          [
            '--yes',
            'newman',
            'run',
            collection,
            '--env-var',
            `baseUrl=http://localhost:${port}/v1`,
            '--env-var',
            `internToken=${internToken}`,
            '--env-var',
            `vermittlerToken=${vermittlerToken}`,
            '--reporters',
            'cli',
          ],
          { timeout: 60_000 },
        );
        // execFileAsync wirft bereits bei einem Newman-Exitcode != 0 (d.h.
        // bei mindestens einem fehlgeschlagenen Test). Zusaetzlich pruefen,
        // dass kein Fehlschlag-Symbol im Bericht auftaucht.
        expect(stdout).not.toMatch(/✗|AssertionError/);
        expect(stdout).toMatch(/requests\s*│\s*12\s*│\s*0/);
      } finally {
        server.close();
      }
    },
    90_000,
  );
});
