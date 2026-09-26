import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

/**
 * Erzeugt ein Test-Token (8 h gueltig) fuer lokale Tests und Postman.
 *
 *   npm run token:intern
 *   npm run token:vermittler -- firma-muster-ag
 */
const scope = process.argv[2] === 'vermittler' ? 'personalvermittlung' : 'intern';
const firmaId = process.argv[3] ?? 'firma-muster-ag';

const payload =
  scope === 'personalvermittlung'
    ? { sub: `vermittler:${firmaId}`, scope, firmaId }
    : { sub: 'intern:hr-sachbearbeiter', scope };

const token = jwt.sign(payload, env.jwtSecret, { expiresIn: '8h' });

console.log(JSON.stringify(payload, null, 2));
console.log('\nBearer-Token (8h gueltig):\n');
console.log(token);
