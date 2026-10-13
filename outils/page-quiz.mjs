// Génère la page /quiz-fruits/ (le jeu lui-même est dans site/js/quiz.js)
import { ecrirePage, ajouterAuPlan } from './gabarit.mjs';

const contenu = `    <section class="section">
      <div class="conteneur">
        <div class="quiz" data-quiz>
          <noscript><p class="centre">Le quiz nécessite JavaScript. Activez-le pour jouer.</p></noscript>
        </div>
      </div>
    </section>
    <section class="section section--creme">
      <article class="conteneur article">
        <h2>Un quiz pour la pause, entre collègues</h2>
        <p>Saviez-vous que la Burlat est une cerise, que le kiwi vient de Chine ou qu'une pomme pèse en moyenne 150&nbsp;g&nbsp;? Ce quiz de 10 questions vous fait voyager dans le monde des fruits&nbsp;: variétés, saisons, nutrition, juste poids, métiers de l'agriculture française et chiffres du monde.</p>
        <p>À chaque partie, une nouvelle série de questions est tirée au hasard parmi plus de cinquante. Après chaque réponse, une courte explication vous en apprend un peu plus. Lancez le défi à vos collègues pendant la pause&nbsp;!</p>
        <h2>Les thèmes du quiz</h2>
        <ul>
          <li><strong>Pomme ou pas pomme&nbsp;?</strong> Gala, Conférence, Burlat, Gariguette… reconnaîtrez-vous le fruit derrière la variété&nbsp;?</li>
          <li><strong>Les saisons</strong>&nbsp;: quand mange-t-on les fraises, les cerises, les clémentines&nbsp;? Voir aussi notre <a href="/calendrier-fruits-de-saison/">calendrier des fruits de saison</a>.</li>
          <li><strong>La nutrition</strong>&nbsp;: vitamines, calories, fibres, les bons repères. Tous les détails dans notre <a href="/blog/fruits/">guide des fruits</a>.</li>
          <li><strong>Le juste poids</strong>&nbsp;: combien pèse une pomme, une banane, un kiwi&nbsp;?</li>
          <li><strong>Nos producteurs</strong>&nbsp;: arboriculteurs, maraîchers, labels, protection des vergers. À lire&nbsp;: <a href="/blog/secheresse-2026-producteurs-fruits/">sécheresse, grêle et carpocapse en 2026</a>.</li>
          <li><strong>La France et le monde</strong>&nbsp;: les fruits les plus consommés et les plus produits.</li>
        </ul>
        <div class="encart">
          <p><strong>Envie de fruits frais de saison au bureau&nbsp;?</strong> Chaque semaine, nous allons chercher les fruits chez nos producteurs et les livrons dans vos locaux, à Paris, en Île-de-France et dans le sud de l'Oise. <a class="js-devis" href="mailto:contact@copanier.fr?subject=Demande%20de%20devis%20corbeilles%20de%20fruits">Demandez votre devis gratuit</a>.</p>
        </div>
      </article>
    </section>
    <script src="/js/quiz.js" defer></script>`;

ecrirePage({
  chemin: '/quiz-fruits/', menu: '/blog/',
  titre: 'Quiz fruits et agriculture : testez vos connaissances | CoPanier',
  description: 'Le quiz des fruits : variétés, saisons, nutrition, juste poids, agriculteurs et producteurs. 10 questions tirées au hasard, une note sur 10, rejouable à volonté.',
  ariane: [['Blog', '/blog/'], ['Quiz des fruits']],
  h1: 'Le quiz des <span class="accent">fruits</span>',
  chapo: 'Variétés, saisons, nutrition, juste poids, métiers de nos producteurs… Testez vos connaissances en 10 questions et défiez vos collègues&nbsp;!',
  contenu,
});
ajouterAuPlan('/quiz-fruits/');
console.log('Page /quiz-fruits/ générée');
