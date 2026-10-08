// =========================================================
// Signale toutes les pages du plan du site à Bing (et Yahoo, Qwant, DuckDuckGo…)
// via IndexNow, après une publication sur GitHub :
//   node outils/signaler-bing.mjs
// =========================================================
import fs from 'node:fs';
import path from 'node:path';
import { SITE, DOMAINE } from './gabarit.mjs';

const CLE = '3f7c7b25bba5af206389fda66c8beaa5'; // fichier site/<clé>.txt
const urls = [...fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(DOMAINE).host, key: CLE, keyLocation: `${DOMAINE}/${CLE}.txt`, urlList: urls }),
});
console.log(r.status === 200 || r.status === 202 ? `${urls.length} pages signalées à Bing.` : `Échec (${r.status}) : ${await r.text()}`);
