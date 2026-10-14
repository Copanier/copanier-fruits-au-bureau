// Génère la page /jeux-fruits/ (les jeux sont dans site/js/jeux.js)
import { ecrirePage, ajouterAuPlan } from './gabarit.mjs';

const contenu = `    <section class="section">
      <div class="conteneur">
        <div class="jeux-onglets" role="tablist" aria-label="Choisir un jeu">
          <a href="#attrape" class="fruits-liens__lien">🧺 Attrape les fruits</a>
          <a href="#saut" class="fruits-liens__lien">🍎 Le saut de la pomme</a>
          <a href="#fraise" class="fruits-liens__lien">🍓 La main à la fraise</a>
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

        <h2 id="fraise" class="jeu__nom">🍓 La main à la fraise</h2>
        <div class="fraise" data-fraise aria-label="Jeu La main à la fraise, de 2 à 12 joueurs"></div>
        <noscript><p class="centre">Les jeux nécessitent JavaScript.</p></noscript>
      </div>
    </section>
    <section class="section section--creme">
      <article class="conteneur article">
        <h2>Trois mini-jeux pour la pause</h2>
        <p><strong>Attrape les fruits</strong>&nbsp;: les fruits tombent de plus en plus vite. Déplacez la corbeille avec le doigt, la souris ou les flèches du clavier pour les attraper. Les règles&nbsp;:</p>
        <ul>
          <li>🍎 chaque fruit attrapé rapporte <strong>1 point</strong>&nbsp;;</li>
          <li>le <strong>logo CoPanier</strong> qui tombe parfois est un bonus de <strong>3 points</strong>&nbsp;;</li>
          <li>🐛 attention aux <strong>vers</strong>&nbsp;: en attraper un vous fait perdre une vie&nbsp;;</li>
          <li>chaque fruit qui touche le sol sans être ramassé vous fait aussi perdre une vie&nbsp;;</li>
          <li>vous avez <strong>3 vies</strong> (les cœurs en haut à droite)&nbsp;: quand elles sont épuisées, la partie s'arrête.</li>
        </ul>
        <p><strong>Le saut de la pomme</strong>&nbsp;: comme le petit dinosaure de votre navigateur, votre pomme roule sans s'arrêter. Appuyez sur la barre espace (ou touchez l'écran) pour sauter par-dessus les cailloux, les vers et les bûches, et attrapez les fruits en l'air pour gagner des mètres.</p>
        <p><strong>La main à la fraise</strong>&nbsp;: le jeu de hasard à faire entre collègues, de 2 à 12 joueurs, sur un seul écran. Les mains fermées sont posées en cercle et une seule cache une fraise. Chacun à son tour choisit une main et l'ouvre. Avant de lancer, choisissez la règle&nbsp;: <em>celui qui trouve la fraise gagne</em>, ou <em>celui qui trouve la fraise perd</em> (pratique pour désigner qui offre les croissants&nbsp;!). La probabilité de tomber sur la fraise s'affiche à chaque tirage&nbsp;: 1 chance sur le nombre de mains encore fermées. Et les perdants sont gentiment chambrés.</p>
        <p>À la fin de chaque partie des deux premiers jeux, inscrivez votre prénom (ou un pseudo) au <strong>classement</strong> pour découvrir votre rang parmi tous les joueurs. Seuls le prénom saisi et le score sont enregistrés et affichés&nbsp;; ils sont conservés 12 mois. N'indiquez pas votre nom complet. Lancez le défi à vos collègues&nbsp;! Vous préférez réfléchir&nbsp;? Essayez notre <a href="/quiz-fruits/">quiz des fruits</a> ou découvrez l'origine des <a href="/expressions-fruits/">expressions avec des fruits</a>.</p>
        <div class="encart">
          <p><strong>Et si les vrais fruits arrivaient au bureau&nbsp;?</strong> Chaque semaine, nous livrons des corbeilles de fruits frais de saison dans les entreprises de Paris, d'Île-de-France et du sud de l'Oise. <a class="js-devis" href="mailto:contact@copanier.fr?subject=Demande%20de%20devis%20corbeilles%20de%20fruits">Demandez votre devis gratuit</a>.</p>
        </div>
      </article>
    </section>
    <script src="/js/jeux.js" defer></script>
    <script src="/js/main-fraise.js" defer></script>`;

ecrirePage({
  chemin: '/jeux-fruits/', menu: '/quiz-fruits/',
  titre: 'Jeux de fruits gratuits entre collègues : attrape, saut, main à la fraise | CoPanier',
  description: 'Trois mini-jeux gratuits pour la pause : attrapez les fruits qui tombent, faites sauter la pomme, ou jouez à « la main à la fraise » entre collègues (2 à 12 joueurs). Battez le record de vos collègues !',
  ariane: [['Blog', '/blog/'], ['Jeux de fruits']],
  h1: 'Les <span class="accent">jeux</span> de fruits',
  chapo: 'Trois mini-jeux pour la pause&nbsp;: attrapez les fruits qui tombent, faites sauter la pomme, ou découvrez qui cache la fraise entre collègues. Qui battra le record&nbsp;?',
  contenu,
});
ajouterAuPlan('/jeux-fruits/');
console.log('Page /jeux-fruits/ générée');
