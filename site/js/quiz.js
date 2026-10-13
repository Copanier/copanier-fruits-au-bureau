/* =========================================================
   Quiz CoPanier : fruits, agriculture française, nutrition
   10 questions tirées au hasard à chaque partie.
   Pour ajouter une question : copier un bloc { t, q, c, r, e }
   (t = thème, q = question, c = 4 choix, r = n° de la bonne réponse de 0 à 3, e = explication).
   ========================================================= */
(function () {
  var QUESTIONS = [
    // --- Pomme ou pas pomme ? ---
    { t: "Pomme ou pas pomme ?", q: "La Gala, c'est…", c: ["Une pomme", "Une poire", "Une prune", "Une pêche"], r: 0, e: "La Gala est l'une des variétés de pommes les plus vendues en France, appréciée pour sa chair sucrée et croquante." },
    { t: "Pomme ou pas pomme ?", q: "La Conférence, c'est…", c: ["Une pomme", "Une poire", "Une cerise", "Un raisin"], r: 1, e: "La Conférence est une poire allongée à la peau rugueuse, très répandue en France." },
    { t: "Pomme ou pas pomme ?", q: "La Burlat, c'est…", c: ["Une fraise", "Une pomme", "Une cerise", "Un abricot"], r: 2, e: "La Burlat est une cerise précoce, souvent l'une des premières de la saison, dès la fin mai." },
    { t: "Pomme ou pas pomme ?", q: "La Gariguette, c'est…", c: ["Une fraise", "Une framboise", "Une prune", "Une pomme"], r: 0, e: "La Gariguette est une fraise allongée et parfumée, emblématique du printemps en France." },
    { t: "Pomme ou pas pomme ?", q: "La Reinette, c'est…", c: ["Une poire", "Une pomme", "Une orange", "Un kiwi"], r: 1, e: "Les Reinettes (grise du Canada, Reine des reinettes…) sont des pommes traditionnelles, parfaites aussi en cuisine." },
    { t: "Pomme ou pas pomme ?", q: "La Williams, c'est…", c: ["Une pomme", "Une prune", "Une poire", "Un raisin"], r: 2, e: "La Williams est une poire juteuse et parfumée, très utilisée aussi pour les eaux-de-vie." },
    { t: "Pomme ou pas pomme ?", q: "Le Chasselas, c'est…", c: ["Un raisin", "Une pomme", "Une figue", "Une cerise"], r: 0, e: "Le Chasselas est un raisin blanc de table ; celui de Moissac bénéficie d'une appellation d'origine protégée (AOP)." },
    { t: "Pomme ou pas pomme ?", q: "La Granny Smith, c'est…", c: ["Une poire verte", "Une pomme", "Un kiwi", "Un citron"], r: 1, e: "La Granny Smith est une pomme verte acidulée, originaire d'Australie." },
    { t: "Pomme ou pas pomme ?", q: "La Reine-claude, c'est…", c: ["Une pomme", "Une poire", "Une prune", "Une pêche"], r: 2, e: "La reine-claude est une prune ronde et très sucrée, nommée en l'honneur de la reine Claude de France, épouse de François Ier." },
    { t: "Pomme ou pas pomme ?", q: "La Pink Lady, c'est…", c: ["Une pomme", "Une fraise", "Une pêche", "Une cerise"], r: 0, e: "Pink Lady est une marque de pommes à la peau rose, issue de la variété Cripps Pink." },
    { t: "Pomme ou pas pomme ?", q: "La Navel, c'est…", c: ["Une pomme", "Une orange", "Une banane", "Une clémentine"], r: 1, e: "La Navel est une orange sans pépins, facile à éplucher, très présente en hiver." },
    { t: "Pomme ou pas pomme ?", q: "La Mirabelle, c'est…", c: ["Une petite prune", "Une cerise", "Un abricot", "Une groseille"], r: 0, e: "La mirabelle est une petite prune dorée, spécialité de la Lorraine, récoltée à la fin de l'été." },

    // --- Saisons ---
    { t: "Saisons", q: "En France, à quelle saison mange-t-on les premières fraises ?", c: ["En hiver", "Au printemps", "En automne", "Toute l'année en pleine terre"], r: 1, e: "Les premières fraises françaises arrivent au printemps, vers avril, et la saison se prolonge jusqu'à l'été." },
    { t: "Saisons", q: "Quel fruit est typiquement de saison en hiver ?", c: ["La cerise", "L'abricot", "La clémentine", "La pêche"], r: 2, e: "La clémentine est la vedette de l'hiver ; celle de Corse est récoltée de novembre au début du printemps." },
    { t: "Saisons", q: "Quel fruit annonce la fin de l'été et l'automne ?", c: ["Le raisin", "La fraise", "La cerise", "Le kiwi"], r: 0, e: "Les vendanges et le raisin de table marquent la fin de l'été et l'automne." },
    { t: "Saisons", q: "À quelle saison l'abricot français est-il récolté ?", c: ["Au printemps", "En été", "En automne", "En hiver"], r: 1, e: "L'abricot se récolte en été, principalement dans la vallée du Rhône, le Roussillon et la Provence." },
    { t: "Saisons", q: "Pourquoi trouve-t-on des pommes françaises presque toute l'année ?", c: ["Elles poussent toute l'année", "Elles sont conservées au froid après la récolte", "Elles sont toutes importées", "Elles sont congelées"], r: 1, e: "Récoltées surtout de fin août à novembre, les pommes de garde se conservent plusieurs mois en chambre froide." },
    { t: "Saisons", q: "Quelle est la saison de la cerise en France ?", c: ["De mai à juillet", "De septembre à novembre", "De décembre à février", "Toute l'année"], r: 0, e: "La cerise a une saison courte, de la fin mai à juillet selon les variétés et les régions." },

    // --- Nutrition ---
    { t: "Nutrition", q: "Lequel de ces fruits contient le plus de vitamine C pour 100 g ?", c: ["La banane", "Le kiwi", "La poire", "Le raisin"], r: 1, e: "Le kiwi apporte environ 85 mg de vitamine C pour 100 g, plus qu'une orange (environ 53 mg)." },
    { t: "Nutrition", q: "Lequel de ces fruits est le plus calorique ?", c: ["La fraise", "La pomme", "La banane", "L'orange"], r: 2, e: "La banane apporte environ 90 kcal pour 100 g, contre environ 32 kcal pour la fraise." },
    { t: "Nutrition", q: "Quelle est la recommandation de santé publique en France ?", c: ["Au moins 2 fruits par semaine", "Au moins 5 fruits et légumes par jour", "1 fruit par jour maximum", "10 fruits par jour"], r: 1, e: "Le repère « au moins 5 fruits et légumes par jour » est porté par le Programme national nutrition santé (PNNS)." },
    { t: "Nutrition", q: "Que représente une portion de fruits ou légumes ?", c: ["Environ 10 g", "Environ 80 à 100 g", "Environ 500 g", "Un kilo"], r: 1, e: "Une portion fait environ 80 à 100 g, soit à peu près la taille d'un poing : une pomme, deux clémentines…" },
    { t: "Nutrition", q: "De quoi la plupart des fruits sont-ils majoritairement composés ?", c: ["De sucre", "D'eau", "De protéines", "De graisses"], r: 1, e: "La plupart des fruits contiennent plus de 80 % d'eau : ils participent aussi à l'hydratation." },
    { t: "Nutrition", q: "Quel minéral la banane apporte-t-elle en bonne quantité ?", c: ["Le potassium", "Le fer", "Le calcium", "L'iode"], r: 0, e: "La banane est une source de potassium, avec environ 360 mg pour 100 g." },
    { t: "Nutrition", q: "Où se trouve une bonne partie des fibres de la pomme ?", c: ["Dans les pépins", "Dans la peau", "Dans la queue", "Nulle part"], r: 1, e: "Une bonne partie des fibres se trouve dans la peau ou juste en dessous : mieux vaut croquer la pomme entière, bien lavée." },
    { t: "Nutrition", q: "Les jus de fruits comptent-ils comme des fruits frais ?", c: ["Oui, sans limite", "Oui, mais un petit verre par jour au maximum", "Non, jamais", "Seulement le jus d'orange"], r: 1, e: "Les recommandations conseillent de ne pas dépasser un petit verre de jus par jour : le fruit entier garde ses fibres." },
    { t: "Nutrition", q: "Quel apport quotidien de référence en vitamine C retient-on pour un adulte ?", c: ["8 mg", "80 mg", "800 mg", "8 g"], r: 1, e: "L'apport de référence en vitamine C est de 80 mg par jour : une orange moyenne suffit presque." },

    // --- Le juste poids ---
    { t: "Le juste poids", q: "Combien pèse en moyenne une pomme ?", c: ["Environ 50 g", "Environ 150 g", "Environ 400 g", "Environ 1 kg"], r: 1, e: "Une pomme moyenne pèse environ 150 g." },
    { t: "Le juste poids", q: "Combien y a-t-il environ de clémentines dans un kilo ?", c: ["4 à 5", "15 à 17", "40 à 50", "100"], r: 1, e: "Une clémentine pèse environ 60 g : un kilo en contient donc une quinzaine." },
    { t: "Le juste poids", q: "Combien pèse environ un kiwi ?", c: ["Environ 75 g", "Environ 250 g", "Environ 10 g", "Environ 500 g"], r: 0, e: "Un kiwi moyen pèse environ 75 g, peau comprise." },
    { t: "Le juste poids", q: "Pour combien de personnes une corbeille CoPanier de 7 kg est-elle prévue ?", c: ["2 à 3 personnes", "15 à 20 personnes", "100 personnes", "50 à 60 personnes"], r: 1, e: "Nos corbeilles de 7 kg conviennent à 15 à 20 personnes ; 10 kg pour 25 à 30 ; 13 kg pour 35 à 40." },
    { t: "Le juste poids", q: "Combien pèse environ une banane épluchée ?", c: ["Environ 30 g", "Environ 120 g", "Environ 350 g", "Environ 600 g"], r: 1, e: "Une banane moyenne épluchée pèse environ 120 g." },
    { t: "Le juste poids", q: "Une barquette classique de framboises pèse…", c: ["Environ 125 g", "Environ 1 kg", "Environ 25 g", "Environ 2 kg"], r: 0, e: "Les framboises, fragiles, sont généralement vendues en barquettes de 125 g." },

    // --- Agriculteurs et producteurs ---
    { t: "Producteurs", q: "Comment appelle-t-on l'agriculteur qui cultive des arbres fruitiers ?", c: ["Un viticulteur", "Un arboriculteur", "Un apiculteur", "Un sylviculteur"], r: 1, e: "L'arboriculteur cultive des arbres fruitiers : pommiers, poiriers, cerisiers, abricotiers…" },
    { t: "Producteurs", q: "Que cultive principalement un maraîcher ?", c: ["Des céréales", "Des légumes", "De la vigne", "Des arbres forestiers"], r: 1, e: "Le maraîcher cultive des légumes, et parfois quelques fruits comme les fraises ou les melons." },
    { t: "Producteurs", q: "Que signifie le sigle HVE ?", c: ["Haute valeur environnementale", "Hors variété européenne", "Haute vitamine essentielle", "Hectare de verger exploité"], r: 0, e: "HVE (haute valeur environnementale) est une certification qui récompense des pratiques agricoles respectueuses de la biodiversité." },
    { t: "Producteurs", q: "Le carpocapse est…", c: ["Un engrais naturel", "Un papillon dont la chenille fait le « ver » de la pomme", "Une variété de poire", "Un outil de taille"], r: 1, e: "La chenille du carpocapse creuse une galerie jusqu'aux pépins et rend la pomme immangeable." },
    { t: "Producteurs", q: "À quoi sert un filet paragrêle ?", c: ["À attirer les abeilles", "À protéger les fruits de la grêle", "À arroser le verger", "À récolter plus vite"], r: 1, e: "Tendu au-dessus des rangs, il arrête les grêlons ; il limite aussi les coups de soleil et protège des oiseaux." },
    { t: "Producteurs", q: "Pourquoi les abeilles sont-elles précieuses pour les vergers ?", c: ["Elles mangent les chenilles", "Elles pollinisent les fleurs", "Elles arrosent les arbres", "Elles éloignent la grêle"], r: 1, e: "En butinant, les abeilles transportent le pollen : sans pollinisation, pas de fruits." },
    { t: "Producteurs", q: "Qu'est-ce que l'éclaircissage dans un verger ?", c: ["Couper les arbres morts", "Retirer une partie des jeunes fruits", "Tailler les racines", "Éclairer le verger la nuit"], r: 1, e: "En retirant une partie des jeunes fruits, l'arbre nourrit mieux ceux qui restent et prépare mieux la récolte suivante." },
    { t: "Producteurs", q: "Que signifie le logo AB ?", c: ["Agriculture biologique", "Agriculture bretonne", "Arbre bio", "Achat bénéfique"], r: 0, e: "Le logo AB garantit un produit issu de l'agriculture biologique, sans pesticides ni engrais chimiques de synthèse." },
    { t: "Producteurs", q: "Quel fruit bénéficie d'une indication géographique protégée (IGP) en Corse ?", c: ["La clémentine", "La fraise", "La cerise", "La poire"], r: 0, e: "La clémentine de Corse IGP se reconnaît souvent à ses feuilles vertes." },
    { t: "Producteurs", q: "La figue de Solliès bénéficie d'une AOP. Dans quel département se trouve Solliès ?", c: ["Le Var", "Le Nord", "Le Finistère", "Le Bas-Rhin"], r: 0, e: "Solliès-Pont, dans le Var, est la capitale de la figue violette AOP." },

    // --- France et monde ---
    { t: "France et monde", q: "Quel est le fruit le plus consommé en France ?", c: ["La banane", "La pomme", "La fraise", "L'orange"], r: 1, e: "La pomme est le premier fruit frais acheté par les ménages en France, et le premier fruit de table cultivé dans l'Hexagone." },
    { t: "France et monde", q: "Quel fruit exotique est le plus consommé en France ?", c: ["La mangue", "L'ananas", "La banane", "Le litchi"], r: 2, e: "La banane est de loin le fruit exotique le plus acheté en France." },
    { t: "France et monde", q: "Quel est le fruit le plus produit au monde ?", c: ["La pomme", "La banane", "La fraise", "La poire"], r: 1, e: "D'après la FAO, la banane est le fruit le plus produit au monde, devant la pastèque et la pomme (si l'on met de côté la tomate, botaniquement un fruit)." },
    { t: "France et monde", q: "Quel pays est le premier producteur mondial de pommes ?", c: ["La France", "Les États-Unis", "La Chine", "L'Italie"], r: 2, e: "La Chine produit à elle seule environ la moitié des pommes du monde." },
    { t: "France et monde", q: "D'où le kiwi est-il originaire ?", c: ["De Nouvelle-Zélande", "De Chine", "Du Brésil", "D'Espagne"], r: 1, e: "Le kiwi vient de Chine ; la Nouvelle-Zélande l'a rendu célèbre et lui a donné son nom, celui de son oiseau emblème." },
    { t: "France et monde", q: "Botaniquement, la tomate est…", c: ["Un légume", "Un fruit", "Une racine", "Une céréale"], r: 1, e: "La tomate est botaniquement un fruit, puisqu'elle contient les graines de la plante, même si on la cuisine comme un légume." },
    { t: "France et monde", q: "La fraise est un « faux fruit ». Où sont ses vrais fruits ?", c: ["Dans la queue", "Les petits grains à sa surface", "Au cœur de la fraise", "Elle n'en a pas"], r: 1, e: "Les vrais fruits du fraisier sont les petits grains (akènes) ; la partie rouge est un réceptacle charnu." },
    { t: "France et monde", q: "À quelle famille botanique appartiennent la pomme, la poire et la cerise ?", c: ["Les Rosacées", "Les Agrumes", "Les Cucurbitacées", "Les Graminées"], r: 0, e: "Pommier, poirier, cerisier, prunier, abricotier : tous font partie de la grande famille des Rosacées, comme le rosier." },
    { t: "France et monde", q: "Quel taux de TVA s'applique aux fruits frais en France ?", c: ["20 %", "10 %", "5,5 %", "0 %"], r: 2, e: "Les fruits frais bénéficient du taux réduit de 5,5 %, comme la plupart des produits alimentaires." },
  ];

  var bloc = document.querySelector("[data-quiz]");
  if (!bloc) return;
  var NB = 10;
  var mouvementReduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var partie, index, score, repondu;

  function melanger(t) { t = t.slice(); for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = t[i]; t[i] = t[j]; t[j] = x; } return t; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  // Tirage équilibré : on mélange puis on alterne les thèmes
  function tirer() {
    var parTheme = {};
    melanger(QUESTIONS).forEach(function (q) { (parTheme[q.t] = parTheme[q.t] || []).push(q); });
    var themes = melanger(Object.keys(parTheme)), choix = [];
    while (choix.length < NB) {
      var ajout = false;
      themes.forEach(function (t) { if (choix.length < NB && parTheme[t].length) { choix.push(parTheme[t].shift()); ajout = true; } });
      if (!ajout) break;
    }
    // On mélange aussi l'ordre des réponses
    return melanger(choix).map(function (q) {
      var ordre = melanger([0, 1, 2, 3]);
      return { t: q.t, q: q.q, e: q.e, c: ordre.map(function (i) { return q.c[i]; }), r: ordre.indexOf(q.r) };
    });
  }

  function accueil() {
    bloc.innerHTML = '<div class="quiz__carte quiz__accueil">' +
      '<div class="quiz__fruits" aria-hidden="true">🍎🍐🍊🍓🍒🍇</div>' +
      '<h2>Prêt à tester vos connaissances&nbsp;?</h2>' +
      '<p>10 questions tirées au hasard sur les fruits, les saisons, la nutrition, le juste poids et le métier de nos producteurs. Une nouvelle série à chaque partie&nbsp;!</p>' +
      '<button type="button" class="bouton" data-commencer>Commencer le quiz</button></div>';
    bloc.querySelector("[data-commencer]").addEventListener("click", commencer);
  }

  function commencer() { partie = tirer(); index = 0; score = 0; question(); }

  function question() {
    var q = partie[index];
    repondu = false;
    bloc.innerHTML = '<div class="quiz__carte">' +
      '<div class="quiz__entete"><span class="quiz__theme">' + esc(q.t) + '</span><span class="quiz__compteur">Question ' + (index + 1) + ' / ' + NB + '</span></div>' +
      '<div class="quiz__progression" role="progressbar" aria-valuemin="0" aria-valuemax="' + NB + '" aria-valuenow="' + index + '"><span style="width:' + (index / NB * 100) + '%"></span></div>' +
      '<h2 class="quiz__question">' + esc(q.q) + '</h2>' +
      '<div class="quiz__choix">' + q.c.map(function (c, i) { return '<button type="button" class="quiz__reponse" data-i="' + i + '">' + esc(c) + '</button>'; }).join("") + '</div>' +
      '<div class="quiz__retour" aria-live="polite"></div></div>';
    [].forEach.call(bloc.querySelectorAll(".quiz__reponse"), function (b) { b.addEventListener("click", function () { repondre(+b.getAttribute("data-i")); }); });
    var premier = bloc.querySelector(".quiz__reponse"); if (premier) premier.focus({ preventScroll: true });
  }

  function repondre(i) {
    if (repondu) return;
    repondu = true;
    var q = partie[index], juste = i === q.r;
    if (juste) score++;
    [].forEach.call(bloc.querySelectorAll(".quiz__reponse"), function (b, k) {
      b.disabled = true;
      if (k === q.r) b.classList.add("est-juste");
      else if (k === i) b.classList.add("est-faux");
    });
    var dernier = index === NB - 1;
    var retour = bloc.querySelector(".quiz__retour");
    retour.innerHTML = '<p class="quiz__verdict ' + (juste ? "ok" : "ko") + '">' + (juste ? "✅ Bonne réponse&nbsp;!" : "❌ Raté&nbsp;! La bonne réponse était&nbsp;: <strong>" + esc(q.c[q.r]) + "</strong>") + '</p>' +
      '<p class="quiz__explication">' + esc(q.e) + '</p>' +
      '<button type="button" class="bouton" data-suivant>' + (dernier ? "Voir ma note" : "Question suivante →") + '</button>';
    var suivant = retour.querySelector("[data-suivant]");
    suivant.addEventListener("click", function () { if (dernier) resultat(); else { index++; question(); } });
    suivant.focus({ preventScroll: true });
  }

  function message(n) {
    if (n === 10) return "Parfait ! Vous êtes un vrai expert des fruits et de nos producteurs.";
    if (n >= 8) return "Excellent ! Vos collègues ont de la chance de vous avoir à la pause.";
    if (n >= 6) return "Très bien ! Encore quelques fruits à découvrir.";
    if (n >= 4) return "Pas mal ! Rejouez pour découvrir de nouvelles questions.";
    return "Il est temps de passer plus de pauses autour de la corbeille de fruits !";
  }

  function resultat() {
    bloc.innerHTML = '<div class="quiz__carte quiz__resultat">' +
      '<p class="quiz__titre-note">Votre note</p>' +
      '<div class="quiz__note"><span class="quiz__chiffre">0</span><span class="quiz__sur">/ 10</span></div>' +
      '<p class="quiz__message">' + esc(message(score)) + '</p>' +
      '<div class="quiz__actions"><button type="button" class="bouton" data-rejouer>🔄 Recommencer avec de nouvelles questions</button>' +
      '<a class="bouton bouton--contour-vert js-devis" href="mailto:contact@copanier.fr?subject=Demande%20de%20devis%20corbeilles%20de%20fruits">Des fruits frais au bureau&nbsp;? Demander un devis</a></div>' +
      '<p class="petit">Défiez vos collègues&nbsp;: partagez cette page avec eux&nbsp;!</p></div>';
    bloc.querySelector("[data-rejouer]").addEventListener("click", commencer);
    var chiffre = bloc.querySelector(".quiz__chiffre");
    var note = bloc.querySelector(".quiz__note");
    if (mouvementReduit) { chiffre.textContent = score; return; }
    // Compteur animé, puis pluie de fruits proportionnelle à la note
    var n = 0, pas = setInterval(function () {
      if (n >= score) { clearInterval(pas); note.classList.add("pop"); pluie(score); return; }
      n++; chiffre.textContent = n;
    }, 120);
    if (score === 0) { clearInterval(pas); note.classList.add("pop"); }
  }

  function pluie(n) {
    if (!n) return;
    var fruits = ["🍎", "🍐", "🍊", "🍓", "🍒", "🍇", "🍑", "🥝", "🍌"];
    var zone = document.createElement("div");
    zone.className = "quiz__pluie";
    zone.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 6 + n * 4; i++) {
      var s = document.createElement("span");
      s.textContent = fruits[Math.floor(Math.random() * fruits.length)];
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDelay = (Math.random() * 1.2).toFixed(2) + "s";
      s.style.animationDuration = (2.2 + Math.random() * 1.6).toFixed(2) + "s";
      s.style.fontSize = (18 + Math.random() * 22).toFixed(0) + "px";
      zone.appendChild(s);
    }
    document.body.appendChild(zone);
    setTimeout(function () { zone.remove(); }, 5000);
  }

  accueil();
})();
