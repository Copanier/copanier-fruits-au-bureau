// =========================================================
// Crée un nouvel article de blog, prêt à être rédigé.
//
//   node outils/nouvel-article.mjs "Titre de l'article" "Thème"
//   (thème facultatif : QVCT, RSE, Santé, Pratique, Fruits…)
//
// L'article est créé dans site/blog/<adresse>/, ajouté en tête de la page Blog
// et au plan du site (sitemap.xml). Rédigez ensuite le texte avec
// « Modifier le site.bat », puis envoyez les changements sur GitHub.
// =========================================================
import fs from 'node:fs';
import path from 'node:path';
import { SITE, DEVIS, ecrirePage, ajouterAuPlan, aujourdhui, echap } from './gabarit.mjs';

const titre = (process.argv[2] || '').trim();
const theme = (process.argv[3] || 'Conseils').trim();
if (!titre) {
  console.error('Usage : node outils/nouvel-article.mjs "Titre de l\'article" "Thème"');
  process.exit(1);
}
const slug = titre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '-')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 9).join('-');
const chemin = `/blog/${slug}/`;
if (fs.existsSync(path.join(SITE, 'blog', slug))) {
  console.error(`L'article ${chemin} existe déjà.`);
  process.exit(1);
}
const html = (s) => echap(s).replace(/ ([:;?!])/g, '&nbsp;$1');
const chapo = 'Remplacez ce texte par le résumé de l\'article (une ou deux phrases).';

ecrirePage({
  chemin, type: 'article', menu: '/blog/',
  titre: `${titre} | CoPanier`,
  description: 'Remplacez ce texte par la description de l\'article affichée dans Google (environ 150 caractères).',
  ariane: [['Blog', '/blog/'], [html(titre)]],
  h1: html(titre), chapo, meta: "Par l'équipe COPANIER · 4 min de lecture",
  contenu: `    <section class="section">
      <article class="conteneur article">
        <p>Introduction de l'article.</p>

        <h2>Premier intertitre</h2>
        <p>Texte du premier paragraphe.</p>

        <h2>Deuxième intertitre</h2>
        <p>Texte du deuxième paragraphe.</p>

        <div class="encart">
          <p><strong>Envie de fruits frais de saison dans vos bureaux&nbsp;?</strong> COPANIER livre chaque semaine des corbeilles de fruits de saison aux entreprises de Paris, d'Île-de-France et du sud de l'Oise. <a class="js-devis" href="${DEVIS}">Demandez votre devis gratuit</a>.</p>
        </div>
        <p><a href="/blog/">← Tous les articles du blog</a></p>
      </article>
    </section>`,
  schemas: [{ '@type': 'BlogPosting', headline: titre, datePublished: aujourdhui(), dateModified: aujourdhui(), inLanguage: 'fr-FR',
    author: { '@type': 'Organization', name: 'COPANIER' }, mainEntityOfPage: chemin }],
});

// Carte en tête de la liste des articles
const blog = path.join(SITE, 'blog', 'index.html');
let s = fs.readFileSync(blog, 'utf8');
const carte = `<div class="grille grille--3">
          <a class="carte carte-article" href="${chemin}">
            <span class="carte-article__theme">${html(theme)} · 4 min</span>
            <h3>${html(titre)}</h3>
            <p>${chapo}</p>
            <span class="lire">Lire l'article →</span>
          </a>`;
s = s.replace('<div class="grille grille--3">', carte);
fs.writeFileSync(blog, s);
ajouterAuPlan(chemin);
ajouterAuPlan('/blog/');

console.log(`Article créé : site/blog/${slug}/index.html
Adresse : ${chemin}
À faire : rédiger le texte (titre, résumé, description Google, paragraphes) avec « Modifier le site.bat »,
puis vérifier le résumé de la carte sur la page Blog.`);
