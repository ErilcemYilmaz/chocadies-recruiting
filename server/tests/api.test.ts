import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// JWT_SECRET muss vor dem Import von env/app gesetzt sein.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/test';

// Repository wird gemockt: diese Tests pruefen die Web-API-Schicht
// (Auth, Validierung, Controller, Fehlerformat), nicht die echte
// MongoDB-Anbindung. Die Persistenz selbst wird ueber
// scripts/testConnection.ts (siehe docs/mongodb-atlas-setup.md) und die
// Postman-Collection (tests/chocadies-recruiting.postman_collection.json)
// gegen eine echte Datenbank abgedeckt.
vi.mock('../src/repositories/bewerbung.repository.js', () => {
  return {
    bewerbungRepository: {
      anlegen: vi.fn(),
      findenNachId: vi.fn(),
      suchen: vi.fn(),
      aendern: vi.fn(),
      loeschen: vi.fn(),
      offeneBewerbungExistiert: vi.fn(),
    },
  };
});

const { bewerbungRepository } = await import('../src/repositories/bewerbung.repository.js');
const { buildApp } = await import('../src/app.js');

const app = buildApp();
const SECRET = process.env.JWT_SECRET as string;

function internToken() {
  return jwt.sign({ sub: 'intern:test', scope: 'intern' }, SECRET, { expiresIn: '1h' });
}
function vermittlerToken(firmaId = 'firma-a') {
  return jwt.sign({ sub: `vermittler:${firmaId}`, scope: 'personalvermittlung', firmaId }, SECRET, {
    expiresIn: '1h',
  });
}

const gueltigeBewerbung = {
  nachname: 'Meier',
  vorname: 'Anna',
  email: 'anna.meier@example.ch',
  stelle: 'Chocolatier/in Produktion Lenzburg',
  standort: 'lenzburg',
};

function alsDbBewerbung(overrides: Record<string, unknown> = {}) {
  return {
    id: '6620f1a2c3d4e5f6a7b8c9d0',
    nachname: 'Meier',
    vorname: 'Anna',
    email: 'anna.meier@example.ch',
    stelle: 'Chocolatier/in Produktion Lenzburg',
    standort: 'lenzburg',
    sprache: 'de',
    status: 'eingegangen',
    dokumente: [],
    eingangsdatum: new Date('2026-08-17T09:14:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Authentisierung', () => {
  it('lehnt Anfragen ohne Authorization-Header mit 401 ab', async () => {
    const res = await request(app).get('/v1/bewerbungen');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NICHT_AUTHENTISIERT');
  });

  it('lehnt ein ungueltiges Token mit 401 ab', async () => {
    const res = await request(app).get('/v1/bewerbungen').set('Authorization', 'Bearer nicht-gueltig');
    expect(res.status).toBe(401);
  });

  it('akzeptiert ein gueltiges internes Token', async () => {
    vi.mocked(bewerbungRepository.suchen).mockResolvedValue({ treffer: [], seite: 1, proSeite: 20, gesamt: 0 });
    const res = await request(app).get('/v1/bewerbungen').set('Authorization', `Bearer ${internToken()}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /v1/bewerbungen', () => {
  it('gibt Trefferliste im openapi-Format zurueck', async () => {
    vi.mocked(bewerbungRepository.suchen).mockResolvedValue({
      treffer: [alsDbBewerbung()],
      seite: 1,
      proSeite: 20,
      gesamt: 1,
    });

    const res = await request(app).get('/v1/bewerbungen').set('Authorization', `Bearer ${internToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ seite: 1, proSeite: 20, gesamt: 1 });
    expect(res.body.treffer).toHaveLength(1);
    expect(res.body.treffer[0].vermittlerId).toBeUndefined();
  });

  it('erzwingt vermittlerId-Filter fuer Personalvermittlungsfirmen und ignoriert eigene Filterwuensche nicht', async () => {
    vi.mocked(bewerbungRepository.suchen).mockResolvedValue({ treffer: [], seite: 1, proSeite: 20, gesamt: 0 });

    await request(app).get('/v1/bewerbungen').set('Authorization', `Bearer ${vermittlerToken('firma-a')}`);

    expect(bewerbungRepository.suchen).toHaveBeenCalledWith(
      expect.objectContaining({ vermittlerId: 'firma-a' }),
    );
  });

  it('weist ungueltige Query-Parameter mit 400 zurueck', async () => {
    const res = await request(app)
      .get('/v1/bewerbungen?proSeite=0')
      .set('Authorization', `Bearer ${internToken()}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDIERUNG_FEHLGESCHLAGEN');
  });
});

describe('POST /v1/bewerbungen', () => {
  it('legt eine gueltige Bewerbung an und antwortet 201', async () => {
    vi.mocked(bewerbungRepository.offeneBewerbungExistiert).mockResolvedValue(false);
    vi.mocked(bewerbungRepository.anlegen).mockResolvedValue(alsDbBewerbung());

    const res = await request(app)
      .post('/v1/bewerbungen')
      .set('Authorization', `Bearer ${internToken()}`)
      .send(gueltigeBewerbung);

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0');
    expect(res.body.nachname).toBe('Meier');
  });

  it('lehnt unbekannte Felder ab (additionalProperties: false)', async () => {
    const res = await request(app)
      .post('/v1/bewerbungen')
      .set('Authorization', `Bearer ${internToken()}`)
      .send({ ...gueltigeBewerbung, unbekanntesFeld: 'x' });

    expect(res.status).toBe(400);
  });

  it('lehnt fehlende Pflichtfelder mit 400 und Feld-Details ab', async () => {
    const { email, ...ohneEmail } = gueltigeBewerbung;
    void email;

    const res = await request(app)
      .post('/v1/bewerbungen')
      .set('Authorization', `Bearer ${internToken()}`)
      .send(ohneEmail);

    expect(res.status).toBe(400);
    expect(res.body.details.some((d: { feld: string }) => d.feld === 'email')).toBe(true);
  });

  it('meldet 409 bei bereits offener Bewerbung fuer dieselbe E-Mail/Stelle', async () => {
    vi.mocked(bewerbungRepository.offeneBewerbungExistiert).mockResolvedValue(true);

    const res = await request(app)
      .post('/v1/bewerbungen')
      .set('Authorization', `Bearer ${internToken()}`)
      .send(gueltigeBewerbung);

    expect(res.status).toBe(409);
    expect(bewerbungRepository.anlegen).not.toHaveBeenCalled();
  });

  it('setzt quelle und vermittlerId serverseitig fuer Personalvermittlungsfirmen, ignoriert Client-Werte', async () => {
    vi.mocked(bewerbungRepository.offeneBewerbungExistiert).mockResolvedValue(false);
    vi.mocked(bewerbungRepository.anlegen).mockResolvedValue(alsDbBewerbung());

    await request(app)
      .post('/v1/bewerbungen')
      .set('Authorization', `Bearer ${vermittlerToken('firma-a')}`)
      .send(gueltigeBewerbung);

    expect(bewerbungRepository.anlegen).toHaveBeenCalledWith(
      expect.objectContaining({ quelle: 'personalvermittlung', vermittlerId: 'firma-a' }),
    );
  });
});

describe('GET /v1/bewerbungen/:id', () => {
  it('gibt 404 wenn nicht gefunden', async () => {
    vi.mocked(bewerbungRepository.findenNachId).mockResolvedValue(null);
    const res = await request(app)
      .get('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${internToken()}`);
    expect(res.status).toBe(404);
  });

  it('gibt 400 bei ungueltigem ID-Format', async () => {
    const res = await request(app)
      .get('/v1/bewerbungen/keine-gueltige-id')
      .set('Authorization', `Bearer ${internToken()}`);
    expect(res.status).toBe(400);
  });

  it('gibt 404 (nicht 403), wenn eine fremde Personalvermittlungsfirma zugreift', async () => {
    vi.mocked(bewerbungRepository.findenNachId).mockResolvedValue(
      alsDbBewerbung({ vermittlerId: 'firma-b' }) as never,
    );
    const res = await request(app)
      .get('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${vermittlerToken('firma-a')}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /v1/bewerbungen/:id', () => {
  it('erlaubt internen Benutzenden den Statuswechsel und protokolliert ihn', async () => {
    vi.mocked(bewerbungRepository.findenNachId).mockResolvedValue(alsDbBewerbung() as never);
    vi.mocked(bewerbungRepository.aendern).mockResolvedValue(
      alsDbBewerbung({ status: 'in_pruefung' }) as never,
    );

    const res = await request(app)
      .put('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${internToken()}`)
      .send({ ...gueltigeBewerbung, status: 'in_pruefung' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_pruefung');
    expect(res.body).not.toHaveProperty('statusverlauf');
    expect(bewerbungRepository.aendern).toHaveBeenCalledWith(
      '6620f1a2c3d4e5f6a7b8c9d0',
      expect.objectContaining({ status: 'in_pruefung' }),
      expect.objectContaining({ status: 'in_pruefung', geaendertVon: 'intern:test' }),
    );
  });

  it('protokolliert nichts, wenn der Status gleich bleibt oder fehlt', async () => {
    vi.mocked(bewerbungRepository.findenNachId).mockResolvedValue(alsDbBewerbung() as never);
    vi.mocked(bewerbungRepository.aendern).mockResolvedValue(alsDbBewerbung() as never);

    const res = await request(app)
      .put('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${internToken()}`)
      .send({ ...gueltigeBewerbung, bemerkung: 'nur Bemerkung' });

    expect(res.status).toBe(200);
    expect(bewerbungRepository.aendern).toHaveBeenCalledWith(
      '6620f1a2c3d4e5f6a7b8c9d0',
      expect.any(Object),
      undefined,
    );
  });

  it('verweigert Personalvermittlungsfirmen den Statuswechsel mit 403', async () => {
    vi.mocked(bewerbungRepository.findenNachId).mockResolvedValue(
      alsDbBewerbung({ vermittlerId: 'firma-a' }) as never,
    );

    const res = await request(app)
      .put('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${vermittlerToken('firma-a')}`)
      .send({ ...gueltigeBewerbung, status: 'eingestellt' });

    expect(res.status).toBe(403);
    expect(bewerbungRepository.aendern).not.toHaveBeenCalled();
  });

  it('weist einen unbekannten Status mit 400 zurueck', async () => {
    const res = await request(app)
      .put('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${internToken()}`)
      .send({ ...gueltigeBewerbung, status: 'vielleicht' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/bewerbungen/:id', () => {
  it('erlaubt internen Benutzenden das Loeschen (204)', async () => {
    vi.mocked(bewerbungRepository.findenNachId).mockResolvedValue(alsDbBewerbung() as never);
    vi.mocked(bewerbungRepository.loeschen).mockResolvedValue(true);

    const res = await request(app)
      .delete('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${internToken()}`);

    expect(res.status).toBe(204);
  });

  it('verweigert Personalvermittlungsfirmen das Loeschen mit 403', async () => {
    vi.mocked(bewerbungRepository.findenNachId).mockResolvedValue(alsDbBewerbung() as never);

    const res = await request(app)
      .delete('/v1/bewerbungen/6620f1a2c3d4e5f6a7b8c9d0')
      .set('Authorization', `Bearer ${vermittlerToken('firma-a')}`);

    expect(res.status).toBe(403);
    expect(bewerbungRepository.loeschen).not.toHaveBeenCalled();
  });
});
