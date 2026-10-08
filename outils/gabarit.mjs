// =========================================================
// Gabarit commun des pages : reprend l'en-tête, le pied de page et la fenêtre
// de devis d'une page existante du site, et y insère un nouveau contenu.
// Utilisé par outils/nouvel-article.mjs (et pour créer le blog / guide des fruits).
// =========================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
export const DOMAINE = 'https://' + fs.readFileSync(path.join(SITE, 'CNAME'), 'utf8').trim();
export const DEVIS = 'mailto:contact@copanier.fr?subject=Demande%20de%20devis%20corbeilles%20de%20fruits';
export const aujourdhui = () => new Date().toISOString().slice(0, 10);

// Page modèle : sa structure (en-tête, pied, fenêtre de devis) est recopiée.
const MODELE = path.join(SITE, 'faq', 'index.html');

const echap = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const texteBrut = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
export { echap, texteBrut };

function modele() {
  const s = fs.readFileSync(MODELE, 'utf8');
  const [avantMain] = s.split('<main id="contenu">');
  const apresMain = s.slice(s.indexOf('</main>') + '</main>'.length);
  const corpsDebut = avantMain.slice(avantMain.indexOf('</head>'));
  const graphe = JSON.parse(s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const communs = graphe.filter((n) => [].concat(n['@type']).some((t) => t === 'Organization' || t === 'WebSite'));
  return { corpsDebut, apresMain, communs };
}

// Marque l'onglet actif du menu (par son adresse).
function menuActif(html, actif) {
  html = html.replace(/ aria-current="page"/g, '');
  if (!actif) return html;
  return html.replace(`<a href="${actif}">`, `<a href="${actif}" aria-current="page">`);
}

/**
 * Écrit une page complète.
 * @param {object} p
 *   chemin      ex. "/blog/mon-article/"
 *   titre       balise <title> (≈ 60 caractères)
 *   description méta description (≈ 155 caractères)
 *   ariane      [["Blog", "/blog/"], ["Titre court"]] (Accueil ajouté automatiquement)
 *   contenu     HTML placé dans <main>
 *   type        "website" | "article"
 *   menu        adresse de l'onglet actif du menu, ex. "/blog/"
 *   schemas     nœuds JSON-LD supplémentaires
 *   robots      facultatif (par défaut index, follow…)
 */
export function ecrirePage(p) {
  const { corpsDebut, apresMain, communs } = modele();
  const url = DOMAINE + p.chemin;
  const image = p.image || DOMAINE + '/images/og-copanier.jpg';
  const ariane = [['Accueil', '/'], ...p.ariane];
  const graphe = [
    ...communs,
    {
      '@type': 'WebPage', '@id': url + '#page', url, name: texteBrut(p.titre), description: p.description,
      inLanguage: 'fr-FR', isPartOf: { '@id': DOMAINE + '/#site' }, about: { '@id': DOMAINE + '/#entreprise' },
      dateModified: p.dateModified || aujourdhui(),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: ariane.map(([nom, lien], i) => ({
        '@type': 'ListItem', position: i + 1, name: texteBrut(nom), item: DOMAINE + (lien || p.chemin),
      })),
    },
    ...(p.schemas || []),
  ];
  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${echap(texteBrut(p.titre))}</title>
  <meta name="description" content="${echap(p.description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="${p.robots || 'index, follow, max-image-preview:large, max-snippet:-1'}">
  <meta name="theme-color" content="#3f6653">
  <meta property="og:type" content="${p.type || 'website'}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="CoPanier de fruits au bureau">
  <meta name="application-name" content="CoPanier de fruits au bureau">
  <meta property="og:title" content="${echap(texteBrut(p.titre))}">
  <meta property="og:description" content="${echap(p.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/images/icon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/images/icon-180.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/fonts/rubik-iJWKBXyIfDnIV7nBrXw.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/fonts/polices.css">
  <link rel="stylesheet" href="/css/style.css">
  <script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': graphe }, null, 1)}
  </script>
${corpsDebut.replace('</head>\n', '').replace('</head>', '')}<main id="contenu">

    <section class="page-titre">
      <div class="conteneur">
        <nav class="ariane" aria-label="Fil d'Ariane"><ol>${ariane.map(([nom, lien], i) =>
          i === ariane.length - 1 ? `<li><span aria-current="page">${nom}</span></li>` : `<li><a href="${lien}">${nom}</a></li>`).join('')}</ol></nav>
        <h1>${p.h1}</h1>
${p.chapo ? `        <p>${p.chapo}</p>\n` : ''}${p.meta ? `        <p class="meta-article">${p.meta}</p>\n` : ''}      </div>
    </section>
${p.contenu}
  </main>${apresMain}`;
  const final = menuActif(html, p.menu);
  const fichier = path.join(SITE, ...p.chemin.split('/').filter(Boolean), 'index.html');
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  fs.writeFileSync(fichier, final);
  return fichier;
}

// Page de redirection (ancienne adresse → nouvelle), non indexée.
export function ecrireRedirection(chemin, cible, raison) {
  const fichier = path.join(SITE, ...chemin.split('/').filter(Boolean), 'index.html');
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  fs.writeFileSync(fichier, `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Page déplacée – CoPanier de fruits au bureau</title>
<meta name="robots" content="noindex, follow">
<meta name="copanier-redirection" content="${echap(raison)}">
<link rel="canonical" href="${DOMAINE}${cible}">
<meta http-equiv="refresh" content="0; url=${cible}">
<script>location.replace("${cible}" + location.hash);</script>
</head>
<body><p>Cette page a été déplacée. <a href="${cible}">Continuer</a>.</p></body>
</html>
`);
}

// Ajoute ou met à jour une adresse dans sitemap.xml.
export function ajouterAuPlan(chemin, date = aujourdhui()) {
  const f = path.join(SITE, 'sitemap.xml');
  let s = fs.readFileSync(f, 'utf8');
  const loc = `<loc>${DOMAINE}${chemin}</loc>`;
  const ligne = `  <url>${loc}<lastmod>${date}</lastmod></url>`;
  const re = new RegExp(`[ \\t]*<url>${loc.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[\\s\\S]*?</url>`);
  s = re.test(s) ? s.replace(re, ligne) : s.replace('</urlset>', ligne + '\n</urlset>');
  fs.writeFileSync(f, s);
}

export function retirerDuPlan(chemin) {
  const f = path.join(SITE, 'sitemap.xml');
  const loc = `<loc>${DOMAINE}${chemin}</loc>`;
  const re = new RegExp(`[ \\t]*<url>${loc.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[\\s\\S]*?</url>\\n?`);
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(re, ''));
}
