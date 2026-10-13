// Génère la page /expressions-fruits/ : expressions françaises autour des fruits, sens et origine
import { ecrirePage, ajouterAuPlan } from './gabarit.mjs';

// fiabilité : 'attestee' (origine établie) | 'hypotheses' (plusieurs pistes) | 'legende' (récit populaire non prouvé)
const GROUPES = [
  { fruit: 'La pomme', emoji: '🍎', id: 'pomme', items: [
    ['Tomber dans les pommes', "S'évanouir.", "L'expression apparaît au XIXe siècle. On cite souvent une lettre de George Sand où elle se dit « dans les pommes cuites » pour exprimer un épuisement extrême. Une autre piste y voit une déformation de « se pâmer » (tomber en pâmoison), devenu « tomber dans les pâmes », puis « dans les pommes ».", 'hypotheses'],
    ['La pomme de discorde', "Le sujet qui sème la dispute.", "Elle vient de la mythologie grecque. Éris, déesse de la discorde, lance une pomme d'or portant l'inscription « à la plus belle ». Héra, Athéna et Aphrodite se la disputent ; Pâris l'attribue à Aphrodite, ce qui mène, selon le mythe, à la guerre de Troie.", 'attestee'],
    ['Croquer la pomme', "Céder à la tentation.", "C'est une allusion au fruit défendu de la Genèse. Le texte biblique ne parle que d'un « fruit » ; il est devenu une pomme dans la tradition occidentale, notamment parce qu'en latin malum signifie à la fois « le mal » et « la pomme ».", 'attestee'],
    ['Haut comme trois pommes', "Tout petit, en parlant d'un enfant.", "L'image, déjà courante au XIXe siècle, est simple : trois pommes posées l'une sur l'autre ne font pas une grande hauteur. On a dit aussi « haut comme une botte ».", 'attestee'],
    ["C'est pour ma pomme", "C'est pour moi (souvent une corvée).", "Dans l'argot du XIXe siècle, « la pomme » désigne la tête, puis la personne elle-même, comme « ma poire » ou « ma pomme » pour « moi ».", 'attestee'],
  ] },
  { fruit: 'La poire', emoji: '🍐', id: 'poire', items: [
    ['Être une bonne poire', "Être naïf, se laisser facilement abuser.", "En 1831, le caricaturiste Charles Philipon dessine le roi Louis-Philippe en forme de poire. Le dessin connaît un succès immense et « poire » devient un mot moqueur pour la tête, puis pour la personne crédule.", 'attestee'],
    ['Se fendre la poire', "Rire de bon cœur.", "Toujours avec « poire » au sens argotique de visage : rire au point d'avoir le visage « fendu » par un large sourire. On dit aussi se fendre la pêche ou la pipe.", 'attestee'],
    ['Couper la poire en deux', "Trouver un compromis, partager équitablement.", "L'image du partage d'un fruit entre deux personnes est ancienne. Elle illustre l'idée que chacun renonce à une part pour arriver à un accord.", 'attestee'],
    ['Garder une poire pour la soif', "Mettre quelque chose de côté pour les jours difficiles.", "Expression ancienne : la poire, très juteuse, était le fruit que l'on gardait pour se désaltérer plus tard, quand l'eau viendrait à manquer en chemin ou aux champs.", 'attestee'],
    ['Entre la poire et le fromage', "À la fin du repas, dans un moment détendu où l'on parle plus librement.", "Dans les repas d'autrefois, les fruits étaient souvent servis avant le fromage. Ce moment de transition, où l'on se détendait, était propice aux confidences et aux discussions moins formelles.", 'hypotheses'],
  ] },
  { fruit: 'Pêche, banane et jus : la bonne humeur', emoji: '🍑', id: 'energie', items: [
    ['Avoir la pêche', "Être en pleine forme, plein d'énergie.", "L'expression s'est répandue dans la seconde moitié du XXe siècle. L'origine est discutée : l'argot employait « pêche » pour un coup de poing (« prendre une pêche »), d'où l'idée de punch et de dynamisme. On rapproche aussi l'expression de ses cousines « avoir la frite » ou « avoir la patate ».", 'hypotheses'],
    ['Avoir la banane', "Avoir un grand sourire.", "Expression récente et très imagée : la forme courbée de la banane rappelle un large sourire étiré jusqu'aux oreilles.", 'attestee'],
    ['Avoir du jus', "Avoir de l'énergie, du dynamisme.", "Dans l'argot du début du XXe siècle, le « jus » désigne le courant électrique. Avoir du jus, c'est donc être « chargé », plein d'énergie. Au contraire, on peut aussi « être à court de jus ».", 'hypotheses'],
    ['Une peau de banane', "Un piège tendu à quelqu'un pour le faire échouer.", "L'image comique de la chute sur une peau de banane, popularisée par le cinéma burlesque, a été reprise dans la vie politique et professionnelle au XXe siècle pour parler d'un coup bas.", 'attestee'],
  ] },
  { fruit: 'La fraise', emoji: '🍓', id: 'fraise', items: [
    ['Ramener sa fraise', "Se mêler de ce qui ne nous regarde pas, intervenir sans y être invité.", "À la fin du XIXe siècle, « la fraise » désigne le visage en argot, sans doute pour sa couleur rouge. Ramener sa fraise, c'est donc s'avancer, montrer sa tête là où on ne l'attend pas.", 'attestee'],
    ['Sucrer les fraises', "Trembler des mains, souvent avec l'âge.", "Expression du XXe siècle : le tremblement évoque le geste de celui qui saupoudre du sucre sur un bol de fraises.", 'hypotheses'],
    ['Aller aux fraises', "S'éloigner, partir se promener, souvent en amoureux.", "Les fraises des bois se cueillaient à l'écart, dans les sous-bois : « aller aux fraises » est devenu un prétexte bien connu pour s'isoler à deux.", 'hypotheses'],
  ] },
  { fruit: 'La cerise', emoji: '🍒', id: 'cerise', items: [
    ['La cerise sur le gâteau', "Le petit plus qui couronne le tout (parfois avec ironie, pour un ennui de trop).", "Expression récente en français, calquée sur l'anglais (« the cherry on the cake », « the icing on the cake »). La cerise confite posée au sommet d'un gâteau en est la touche finale.", 'attestee'],
    ['Avoir la cerise', "Avoir de la malchance, être poursuivi par la poisse.", "Expression d'argot du XXe siècle dont l'origine reste obscure. Elle est l'équivalent de « avoir la poisse » ou « avoir la scoumoune ».", 'hypotheses'],
  ] },
  { fruit: 'La prune', emoji: '🟣', id: 'prune', items: [
    ['Pour des prunes', "Pour rien, en pure perte.", "Un récit populaire raconte qu'en 1148, lors de la deuxième croisade, les croisés auraient échoué devant Damas et ne seraient revenus qu'avec des pruniers, d'où l'idée d'être partis « pour des prunes ». C'est une jolie histoire, mais rien ne la prouve : la prune, fruit commun et bon marché, symbolisait surtout une chose sans valeur.", 'legende'],
    ['Se prendre une prune', "Recevoir une contravention.", "En argot, la « prune » désignait d'abord un coup ou une balle de fusil, petite et ronde comme le fruit. Le mot a ensuite glissé vers l'amende, qui « tombe » sur le conducteur.", 'hypotheses'],
  ] },
  { fruit: 'Raisin et figue', emoji: '🍇', id: 'raisin', items: [
    ['Ils sont trop verts', "Dénigrer ce que l'on ne peut pas obtenir.", "Allusion à la fable « Le Renard et les Raisins » de Jean de La Fontaine (1668), reprise d'Ésope : le renard, incapable d'atteindre les raisins, déclare qu'ils sont « trop verts, et bons pour des goujats ».", 'attestee'],
    ['Mi-figue, mi-raisin', "Mitigé, à moitié satisfait, entre le plaisir et le mécontentement.", "On raconte que des marchands de Corinthe mêlaient aux précieux raisins secs des figues de moindre valeur, pour un résultat décevant. L'origine précise n'est pas établie ; l'expression joue en tout cas sur l'opposition entre deux fruits de valeur différente.", 'legende'],
  ] },
  { fruit: 'Le citron', emoji: '🍋', id: 'citron', items: [
    ['Presser quelqu\'un comme un citron', "L'exploiter jusqu'au bout, puis le délaisser.", "Image très parlante : on presse le citron pour en tirer tout le jus, puis on jette l'écorce.", 'attestee'],
    ['Se presser le citron', "Réfléchir intensément, se creuser la tête.", "En argot, le « citron » désigne la tête : se presser le citron, c'est faire travailler son cerveau jusqu'à la dernière goutte.", 'attestee'],
  ] },
  { fruit: 'Noix et melon', emoji: '🍈', id: 'noix', items: [
    ['À la noix', "Sans valeur, de mauvaise qualité.", "Expression du XIXe siècle, souvent complétée en « à la noix de coco ». La noix, petite et commune, symbolisait une chose sans importance.", 'hypotheses'],
    ['Avoir le melon', "Être prétentieux, avoir la grosse tête.", "En argot, le « melon » désigne la tête (le chapeau melon doit d'ailleurs son nom à sa forme). Avoir le melon, c'est avoir la tête qui enfle d'orgueil.", 'attestee'],
  ] },
  { fruit: 'Les fruits en général', emoji: '🧺', id: 'fruits', items: [
    ['Porter ses fruits', "Donner de bons résultats.", "Image agricole et biblique : dans l'Évangile selon Matthieu, « on reconnaît l'arbre à ses fruits ». Un effort qui porte ses fruits est comme un arbre bien soigné qui donne une belle récolte.", 'attestee'],
    ['Le fruit défendu', "Ce qui est interdit, et d'autant plus désirable.", "Référence au récit de la Genèse, où Adam et Ève goûtent le fruit de l'arbre de la connaissance du bien et du mal, malgré l'interdiction.", 'attestee'],
    ['Tomber comme un fruit mûr', "Arriver naturellement, sans effort, au bon moment.", "Comme le fruit qui se détache seul de l'arbre lorsqu'il est à maturité, une situation finit par se dénouer d'elle-même.", 'attestee'],
  ] },
];

const BADGE = {
  attestee: ['Origine attestée', 'expr-badge--ok'],
  hypotheses: ['Plusieurs hypothèses', 'expr-badge--moyen'],
  legende: ['Légende populaire', 'expr-badge--legende'],
};
const total = GROUPES.reduce((n, g) => n + g.items.length, 0);

const contenu = `    <section class="section">
      <div class="conteneur">
        <nav class="fruits-liens expr-sommaire" aria-label="Expressions par fruit">${GROUPES.map((g) => `<a href="#${g.id}"><span aria-hidden="true">${g.emoji}</span> ${g.fruit}</a>`).join('')}</nav>
        <p class="petit">Pour chaque expression, nous indiquons si l'origine est <strong>attestée</strong>, si plusieurs <strong>hypothèses</strong> coexistent, ou s'il s'agit d'une <strong>légende populaire</strong>&nbsp;: l'histoire des mots est souvent moins certaine qu'on ne le croit.</p>
${GROUPES.map((g) => `        <h2 id="${g.id}" class="expr-titre"><span aria-hidden="true">${g.emoji}</span> ${g.fruit}</h2>
        <div class="grille grille--2 expr-grille">
${g.items.map(([e, sens, origine, f]) => `          <article class="carte expr-carte">
            <h3>«&nbsp;${e}&nbsp;»</h3>
            <p class="expr-sens"><strong>Sens&nbsp;:</strong> ${sens}</p>
            <p><strong>Origine&nbsp;:</strong> ${origine}</p>
            <span class="expr-badge ${BADGE[f][1]}">${BADGE[f][0]}</span>
          </article>`).join('\n')}
        </div>`).join('\n')}
      </div>
    </section>
    <section class="section section--creme">
      <article class="conteneur article">
        <h2>Pourquoi tant d'expressions avec des fruits&nbsp;?</h2>
        <p>Pendant des siècles, la plupart des Français vivaient à la campagne, au rythme des récoltes. Les fruits faisaient partie du quotidien&nbsp;: on les cueillait, on les conservait, on les partageait. Rien d'étonnant à ce qu'ils aient nourri la langue autant que les estomacs. L'argot du XIXe siècle a ensuite multiplié les images&nbsp;: la poire, la pomme, la fraise, le citron ou le melon y désignent tous… la tête&nbsp;!</p>
        <p>Envie de tester vos connaissances sur les fruits eux-mêmes&nbsp;? Essayez notre <a href="/quiz-fruits/">quiz des fruits</a>, ou découvrez les variétés, les saisons et les bienfaits de chacun dans notre <a href="/blog/fruits/">guide des fruits</a>.</p>
        <p class="petit">Sources&nbsp;: dictionnaires historiques de la langue française (Trésor de la langue française, Littré), fables de La Fontaine, textes bibliques et mythologiques. Les dates d'apparition des expressions d'argot restent approximatives.</p>
        <div class="encart">
          <p><strong>Pour avoir la pêche au bureau&nbsp;!</strong> Chaque semaine, nous livrons des corbeilles de fruits frais de saison dans les entreprises de Paris, d'Île-de-France et du sud de l'Oise. <a class="js-devis" href="mailto:contact@copanier.fr?subject=Demande%20de%20devis%20corbeilles%20de%20fruits">Demandez votre devis gratuit</a>.</p>
        </div>
      </article>
    </section>`;

ecrirePage({
  chemin: '/expressions-fruits/', menu: '/blog/',
  titre: 'Expressions avec des fruits : sens et origine | CoPanier',
  description: `Avoir la pêche, tomber dans les pommes, ramener sa fraise, pour des prunes… ${total} expressions françaises avec des fruits, leur sens et leur véritable origine historique.`,
  ariane: [['Blog', '/blog/'], ['Expressions avec des fruits']],
  h1: 'Les expressions avec des <span class="accent">fruits</span>&nbsp;: sens et origine',
  chapo: `Avoir la pêche, tomber dans les pommes, ramener sa fraise… Voici ${total} expressions fruitées de la langue française, ce qu'elles veulent dire et d'où elles viennent vraiment.`,
  contenu,
  schemas: [{ '@type': 'Article', headline: 'Les expressions avec des fruits : sens et origine', inLanguage: 'fr-FR', author: { '@type': 'Organization', name: 'COPANIER' }, datePublished: new Date().toISOString().slice(0, 10) }],
});
ajouterAuPlan('/expressions-fruits/');
console.log(`Page /expressions-fruits/ générée (${total} expressions)`);
