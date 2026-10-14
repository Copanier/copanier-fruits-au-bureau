// Génère la page /jeux-fruits/ (les jeux sont dans site/js/jeux.js)
import { ecrirePage, ajouterAuPlan } from './gabarit.mjs';

const contenu = `    <section class="section">
      <div class="conteneur">
        <div class="jeux-onglets" role="tablist" aria-label="Choisir un jeu">
          <a href="#attrape" class="fruits-liens__lien">🧺 Attrape les fruits</a>
          <a href="#saut" class="fruits-liens__lien">🍎 Le saut de la pomme</a>
        </div>

        <h2 id="attrape" class="jeu__nom">🧺 Attrape les fruits</h2>
        <div class="jeu" data-jeu="attrape">
          <canvas aria-label="Jeu Attrape les fruits : déplacez la cagette pour attraper les fruits qui tombent"></canvas>
          <div class="jeu__ecran" hidden></div>
        </div>
        <div class="jeu__classement" data-classement="attrape"><p class="jeu__classement-titre">🏆 Le classement</p><div class="jeu__classement-liste"><p class="jeu__classement-vide">Chargement…</p></div></div>

        <h2 id="saut" class="jeu__nom">🍎 Le saut de la pomme</h2>
        <div class="jeu" data-jeu="saut">
          <canvas aria-label="Jeu Le saut de la pomme : sautez par-dessus les obstacles"></canvas>
          <div class="jeu__ecran" hidden></div>
        </div>
        <div class="jeu__classement" data-classement="saut"><p class="jeu__classement-titre">🏆 Le classement</p><div class="jeu__classement-liste"><p class="jeu__classement-vide">Chargement…</p></div></div>
        <noscript><p class="centre">Les jeux nécessitent JavaScript.</p></noscript>
      </div>
    </section>
    <section class="section section--creme">
      <article class="conteneur article">
        <h2>Deux mini-jeux pour la pause</h2>
        <p><strong>Attrape les fruits</strong>&nbsp;: les fruits tombent de plus en plus vite. Déplacez la cagette avec le doigt, la souris ou les flèches du clavier pour les attraper avant qu'ils touchent le sol. Attention aux vers&nbsp;! Trois fruits manqués et la partie s'arrête.</p>
        <p><strong>Le saut de la pomme</strong>&nbsp;: comme le petit dinosaure de votre navigateur, votre pomme roule sans s'arrêter. Appuyez sur la barre espace (ou touchez l'écran) pour sauter par-dessus les cailloux, les vers et les bûches, et attrapez les fruits en l'air pour gagner des mètres.</p>
        <p>À la fin de chaque partie, inscrivez votre prénom (ou un pseudo) au <strong>classement</strong> pour découvrir votre rang parmi tous les joueurs. Seuls le prénom saisi et le score sont enregistrés et affichés&nbsp;; ils sont conservés 12 mois. N'indiquez pas votre nom complet. Lancez le défi à vos collègues&nbsp;! Vous préférez réfléchir&nbsp;? Essayez notre <a href="/quiz-fruits/">quiz des fruits</a> ou découvrez l'origine des <a href="/expressions-fruits/">expressions avec des fruits</a>.</p>
        <div class="encart">
          <p><strong>Et si les vrais fruits arrivaient au bureau&nbsp;?</strong> Chaque semaine, nous livrons des corbeilles de fruits frais de saison dans les entreprises de Paris, d'Île-de-France et du sud de l'Oise. <a class="js-devis" href="mailto:contact@copanier.fr?subject=Demande%20de%20devis%20corbeilles%20de%20fruits">Demandez votre devis gratuit</a>.</p>
        </div>
      </article>
    </section>
    <script src="/js/jeux.js" defer></script>`;

ecrirePage({
  chemin: '/jeux-fruits/', menu: '/quiz-fruits/',
  titre: 'Jeux de fruits gratuits : attrape les fruits et saut de la pomme | CoPanier',
  description: 'Deux mini-jeux gratuits pour la pause : attrapez les fruits qui tombent avec votre cagette, ou faites sauter la pomme par-dessus les obstacles. Battez le record de vos collègues !',
  ariane: [['Blog', '/blog/'], ['Jeux de fruits']],
  h1: 'Les <span class="accent">jeux</span> de fruits',
  chapo: 'Deux mini-jeux pour la pause&nbsp;: attrapez les fruits qui tombent, ou faites sauter la pomme par-dessus les obstacles. Qui battra le record&nbsp;?',
  contenu,
});
ajouterAuPlan('/jeux-fruits/');
console.log('Page /jeux-fruits/ générée');
