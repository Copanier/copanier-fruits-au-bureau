// =========================================================
// COPANIER — serveur local pour voir et MODIFIER le site
// Lancé par « Modifier le site.bat ». Ne pas mettre en ligne.
// =========================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const OUTILS = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(process.argv[2] || path.join(OUTILS, '..', 'site'));
const SAUVEGARDES = path.join(OUTILS, '..', 'sauvegardes');
const PORT = Number(process.argv[3]) || 4321;
const OUVRIR = !process.argv.includes('--sans-navigateur');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};
const INJECTION = '<link rel="stylesheet" href="/__edition/edition.css" data-edition-injecte>\n<script src="/__edition/edition.js" defer data-edition-injecte></script>\n';

// Chemin d'URL → fichier du site (refuse tout ce qui sort du dossier « site »).
function fichierDepuisUrl(url) {
  let p = decodeURIComponent(String(url).split('?')[0].split('#')[0]);
  let f = path.resolve(RACINE, '.' + p);
  if (f !== RACINE && !f.startsWith(RACINE + path.sep)) return null;
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  return f;
}

function listePages() {
  return fs.readdirSync(RACINE, { recursive: true })
    .filter((f) => f.endsWith('.html'))
    .map((f) => {
      const html = fs.readFileSync(path.join(RACINE, f), 'utf8');
      if (html.includes('copanier-redirection')) return null; // anciennes adresses Wix : simples redirections
      const titre = (html.match(/<title>([\s\S]*?)<\/title>/) || [, f])[1].replace(/\s*\|\s*(COPANIER|CoPanier)$/, '').replace(/\s*–\s*COPANIER$/, '');
      const url = '/' + f.replace(/\\/g, '/').replace(/index\.html$/, '');
      return { url, titre };
    })
    .filter(Boolean)
    .sort((a, b) => (a.url === '/' ? -1 : b.url === '/' ? 1 : a.url.localeCompare(b.url)));
}

function enregistrer(url, html) {
  const f = fichierDepuisUrl(url);
  if (!f || !f.endsWith('.html') || !fs.existsSync(f)) throw new Error('Page introuvable : ' + url);
  if (!/^<!doctype html>/i.test(html) || !html.includes('</html>')) throw new Error('Contenu invalide');
  // Copie de sécurité de l'ancienne version
  const horodatage = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const copie = path.join(SAUVEGARDES, horodatage, path.relative(RACINE, f));
  fs.mkdirSync(path.dirname(copie), { recursive: true });
  fs.copyFileSync(f, copie);
  fs.writeFileSync(f, html, 'utf8');
  return path.relative(RACINE, f);
}

const serveur = http.createServer((req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/__edition/enregistrer') {
      let corps = '';
      req.on('data', (d) => { corps += d; if (corps.length > 5e6) req.destroy(); });
      req.on('end', () => {
        try {
          const { url, html } = JSON.parse(corps);
          const nom = enregistrer(url, html);
          console.log('  ✔ Enregistré : ' + nom);
          res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true, fichier: nom }));
        } catch (e) {
          res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: false, erreur: e.message }));
        }
      });
      return;
    }
    if (req.url === '/__edition/pages') {
      return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(listePages()));
    }
    if (req.url.startsWith('/__edition/')) {
      const nom = path.basename(req.url.split('?')[0]);
      const f = path.join(OUTILS, nom);
      if (!['edition.js', 'edition.css'].includes(nom) || !fs.existsSync(f)) return res.writeHead(404).end();
      return res.writeHead(200, { 'content-type': TYPES[path.extname(f)], 'cache-control': 'no-store' }).end(fs.readFileSync(f));
    }
    let f = fichierDepuisUrl(req.url);
    let statut = 200;
    if (!f || !fs.existsSync(f)) { f = path.join(RACINE, '404.html'); statut = 404; }
    const ext = path.extname(f);
    let contenu = fs.readFileSync(f);
    if (ext === '.html') contenu = contenu.toString('utf8').replace('</head>', INJECTION + '</head>');
    res.writeHead(statut, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' }).end(contenu);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

serveur.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('\n  Le site est déjà ouvert (port ' + PORT + ').');
    if (OUVRIR) exec(`start "" "http://localhost:${PORT}/?edition"`);
    setTimeout(() => process.exit(0), 1500);
  } else throw e;
});

serveur.listen(PORT, '127.0.0.1', () => {
  const adresse = `http://localhost:${PORT}/?edition`;
  console.log('\n  =============================================');
  console.log('   COPANIER — modification du site');
  console.log('  =============================================');
  console.log('   Le site est ouvert dans votre navigateur :');
  console.log('   ' + adresse);
  console.log('\n   Cliquez sur un texte pour le modifier, puis');
  console.log('   sur « Enregistrer » en bas de la page.');
  console.log('\n   Laissez cette fenêtre ouverte pendant vos');
  console.log('   modifications. Fermez-la quand vous avez fini.');
  console.log('  =============================================\n');
  if (OUVRIR) exec(`start "" "${adresse}"`);
});
