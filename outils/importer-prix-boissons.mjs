// Reprend le tableau complété outils/sapins/prix-boissons.local.csv (Excel, séparateur « ; »)
// et met à jour les prix de vente, contenances et produits proposés dans outils/sapins/config.json,
// puis régénère la page des sapins.
//   node outils/importer-prix-boissons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ici = path.dirname(fileURLToPath(import.meta.url));
const fichierConfig = path.join(ici, 'sapins', 'config.json');
const fichierCsv = path.join(ici, 'sapins', 'prix-boissons.local.csv');
const config = JSON.parse(fs.readFileSync(fichierConfig, 'utf8'));

function lireCsv(texte) {
  const lignes = [];
  let ligne = [], champ = '', guillemets = false;
  texte = texte.replace(/^﻿/, '');
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ';') { ligne.push(champ); champ = ''; }
    else if (c === '\n') { ligne.push(champ.replace(/\r$/, '')); lignes.push(ligne); ligne = []; champ = ''; }
    else champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes.filter((l) => l.some((x) => x.trim()));
}
const nombre = (v) => { const n = parseFloat(String(v || '').replace(/\s|€/g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null; };

const [entete, ...lignes] = lireCsv(fs.readFileSync(fichierCsv, 'utf8'));
const col = (motif) => entete.findIndex((t) => motif.test(t));
const iProduit = col(/^Produit/i), iContenance = col(/Contenance/i), iVente = col(/prix de vente/i), iProposer = col(/proposer/i);
let maj = 0, retires = 0;
for (const l of lignes) {
  const p = config.boissons.produits.find((x) => x.nom === l[iProduit]);
  if (!p) { console.warn('Produit inconnu, ignoré :', l[iProduit]); continue; }
  if (iContenance >= 0) p.contenance = (l[iContenance] || '').trim();
  if (iVente >= 0) p.prix_ttc = nombre(l[iVente]);
  p.propose = !(iProposer >= 0 && /^non/i.test((l[iProposer] || '').trim()));
  if (!p.propose) retires++;
  maj++;
}
fs.writeFileSync(fichierConfig, JSON.stringify(config, null, 2) + '\n');
console.log(`${maj} produit(s) mis à jour, ${retires} non proposé(s), ${config.boissons.produits.filter((p) => p.prix_ttc).length} avec un prix de vente.`);
execFileSync(process.execPath, [path.join(ici, 'page-sapins.mjs')], { stdio: 'inherit' });
