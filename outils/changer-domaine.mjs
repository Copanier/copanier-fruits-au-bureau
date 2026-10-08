// =========================================================
// Change l'adresse officielle du site dans toutes les pages
// (liens canoniques, données Google, plan du site, robots.txt, llms.txt, CNAME).
//
//   Aujourd'hui (site provisoire indexé) :
//     node outils/changer-domaine.mjs copanierdefruits.copanier.fr
//   Le jour de la bascule (le nouveau site remplace l'ancien Wix) :
//     node outils/changer-domaine.mjs www.copanier.fr
// Puis envoyer les changements sur GitHub, et régler le domaine dans GitHub → Settings → Pages.
// =========================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const nouveau = (process.argv[2] || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const CONNUS = ['www.copanier.fr', 'copanierdefruits.copanier.fr'];
if (!CONNUS.includes(nouveau)) {
  console.error('Usage : node outils/changer-domaine.mjs ' + CONNUS.join(' | '));
  process.exit(1);
}
const anciens = CONNUS.filter((d) => d !== nouveau);
let fichiers = 0;
for (const f of fs.readdirSync(SITE, { recursive: true })) {
  if (!/\.(html|xml|txt|webmanifest)$/.test(f)) continue;
  const p = path.join(SITE, f);
  const avant = fs.readFileSync(p, 'utf8');
  let apres = avant;
  for (const a of anciens) apres = apres.split('https://' + a).join('https://' + nouveau);
  if (apres !== avant) { fs.writeFileSync(p, apres); fichiers++; }
}
fs.writeFileSync(path.join(SITE, 'CNAME'), nouveau + '\n');
const robots = path.join(SITE, 'robots.txt');
fs.writeFileSync(robots, fs.readFileSync(robots, 'utf8').replace(/Sitemap: .*/, `Sitemap: https://${nouveau}/sitemap.xml`));
console.log(`Adresse officielle : https://${nouveau} — ${fichiers} fichiers mis à jour, CNAME et robots.txt réécrits.`);
