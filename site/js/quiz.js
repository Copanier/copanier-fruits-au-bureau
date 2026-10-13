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

    // --- Pomme ou pas pomme ? (suite) ---
    { t: "Pomme ou pas pomme ?", q: "La Golden, c'est…", c: ["Une pomme", "Une poire", "Une prune", "Un melon"], r: 0, e: "La Golden est la pomme jaune la plus cultivée en France ; celle du Limousin bénéficie d'une AOP." },
    { t: "Pomme ou pas pomme ?", q: "La Fuji, c'est…", c: ["Une pomme", "Une poire", "Un kaki", "Un litchi"], r: 0, e: "La Fuji est une pomme très sucrée, créée au Japon au milieu du XXe siècle." },
    { t: "Pomme ou pas pomme ?", q: "La Boskoop, c'est…", c: ["Une poire", "Une pomme", "Une cerise", "Une prune"], r: 1, e: "La Boskoop est une grosse pomme acidulée, idéale pour les tartes et les compotes." },
    { t: "Pomme ou pas pomme ?", q: "La Braeburn, c'est…", c: ["Une pomme", "Une fraise", "Une orange", "Une poire"], r: 0, e: "La Braeburn est une pomme croquante et acidulée, originaire de Nouvelle-Zélande." },
    { t: "Pomme ou pas pomme ?", q: "L'Elstar, c'est…", c: ["Une cerise", "Une pomme", "Un abricot", "Une figue"], r: 1, e: "L'Elstar est une pomme néerlandaise, bicolore et parfumée." },
    { t: "Pomme ou pas pomme ?", q: "La Canada grise, c'est…", c: ["Une poire", "Une prune", "Une pomme", "Un raisin"], r: 2, e: "La Reinette grise du Canada est une vieille variété de pomme française à la peau rugueuse, parfaite cuite." },
    { t: "Pomme ou pas pomme ?", q: "Le Doyenné du Comice, c'est…", c: ["Une pomme", "Une poire", "Une prune", "Une pêche"], r: 1, e: "Le Doyenné du Comice est une poire fondante, obtenue à Angers au XIXe siècle." },
    { t: "Pomme ou pas pomme ?", q: "La Louise-Bonne, c'est…", c: ["Une poire", "Une cerise", "Une fraise", "Une pomme"], r: 0, e: "La Louise-Bonne est une ancienne variété de poire française, juteuse et sucrée." },
    { t: "Pomme ou pas pomme ?", q: "La Passe-Crassane, c'est…", c: ["Une pomme", "Une poire d'hiver", "Une orange", "Un raisin"], r: 1, e: "La Passe-Crassane est une poire d'hiver, souvent vendue avec la queue cachetée de cire rouge." },
    { t: "Pomme ou pas pomme ?", q: "Le Bigarreau, c'est…", c: ["Une cerise", "Une prune", "Un abricot", "Un raisin"], r: 0, e: "Les bigarreaux sont des cerises à chair ferme et croquante, comme le Napoléon ou le Summit." },
    { t: "Pomme ou pas pomme ?", q: "La Montmorency, c'est…", c: ["Une pomme", "Une cerise acidulée", "Une poire", "Une fraise"], r: 1, e: "La Montmorency est une cerise acidulée, du nom d'une commune du Val-d'Oise autrefois réputée pour ses cerisiers." },
    { t: "Pomme ou pas pomme ?", q: "La Mara des bois, c'est…", c: ["Une fraise", "Une framboise", "Une cerise", "Une prune"], r: 0, e: "La Mara des bois est une fraise au parfum de fraise des bois, qui produit jusqu'à l'automne." },
    { t: "Pomme ou pas pomme ?", q: "La Ciflorette, c'est…", c: ["Une pomme", "Une fraise", "Une pêche", "Une poire"], r: 1, e: "La Ciflorette est une fraise allongée et sucrée, cultivée notamment dans le Sud-Ouest." },
    { t: "Pomme ou pas pomme ?", q: "La Hayward, c'est…", c: ["Un kiwi", "Une pomme", "Une banane", "Une orange"], r: 0, e: "La Hayward est la variété de kiwi vert la plus cultivée au monde." },
    { t: "Pomme ou pas pomme ?", q: "Le Bergeron, c'est…", c: ["Une poire", "Un abricot", "Une cerise", "Une pomme"], r: 1, e: "Le Bergeron est un abricot emblématique de la vallée du Rhône, ferme et parfumé." },
    { t: "Pomme ou pas pomme ?", q: "Le Muscat, c'est…", c: ["Un raisin", "Une poire", "Une figue", "Une pomme"], r: 0, e: "Le Muscat est un raisin très parfumé ; le Muscat du Ventoux bénéficie d'une AOP." },
    { t: "Pomme ou pas pomme ?", q: "La Quetsche, c'est…", c: ["Une cerise", "Une prune", "Une poire", "Un abricot"], r: 1, e: "La quetsche est une prune violette et ovale, emblématique de l'Alsace et de la Lorraine." },
    { t: "Pomme ou pas pomme ?", q: "La prune d'Ente sert surtout à faire…", c: ["Du cidre", "Le pruneau d'Agen", "De la confiture de fraise", "Du jus d'orange"], r: 1, e: "Séchée, la prune d'Ente devient le célèbre pruneau d'Agen, protégé par une IGP." },
    { t: "Pomme ou pas pomme ?", q: "La Cavendish, c'est…", c: ["Une banane", "Une pomme", "Une mangue", "Un ananas"], r: 0, e: "La Cavendish est la variété de banane la plus vendue dans le monde." },
    { t: "Pomme ou pas pomme ?", q: "La Hass, c'est une variété de…", c: ["Pomme", "Avocat", "Poire", "Mangue"], r: 1, e: "L'avocat Hass, à la peau grumeleuse qui noircit en mûrissant, est le plus vendu au monde." },
    { t: "Pomme ou pas pomme ?", q: "La Tarocco, c'est…", c: ["Une orange sanguine", "Une pomme", "Une poire", "Un citron"], r: 0, e: "La Tarocco est une orange sanguine de Sicile, à la chair rougeâtre." },
    { t: "Pomme ou pas pomme ?", q: "Le Charentais, c'est…", c: ["Une poire", "Un melon", "Une prune", "Une pêche"], r: 1, e: "Le melon charentais, à la chair orange, est le melon le plus consommé en France." },
    { t: "Pomme ou pas pomme ?", q: "La Victoria, c'est…", c: ["Un ananas", "Une pomme", "Une cerise", "Une poire"], r: 0, e: "L'ananas Victoria, petit et très sucré, est cultivé notamment à La Réunion." },
    { t: "Pomme ou pas pomme ?", q: "La Reine des reinettes, c'est…", c: ["Une poire", "Une pomme", "Une prune", "Une fraise"], r: 1, e: "La Reine des reinettes est une pomme ancienne, à la fois sucrée et acidulée." },
    { t: "Pomme ou pas pomme ?", q: "La Rouge du Roussillon, c'est…", c: ["Un abricot", "Une cerise", "Une pomme", "Une tomate"], r: 0, e: "L'abricot Rouge du Roussillon est une variété réputée des Pyrénées-Orientales." },

    // --- Saisons (suite) ---
    { t: "Saisons", q: "À quelle saison récolte-t-on le kiwi en France ?", c: ["Au printemps", "En été", "À la fin de l'automne", "En plein été"], r: 2, e: "Le kiwi se récolte en France en fin d'automne, puis se conserve et se vend tout l'hiver." },
    { t: "Saisons", q: "Quand la mirabelle est-elle de saison ?", c: ["En janvier", "En août et septembre", "En avril", "En décembre"], r: 1, e: "La mirabelle de Lorraine se récolte à la fin de l'été, en août et septembre." },
    { t: "Saisons", q: "Quel fruit ramasse-t-on en forêt en automne ?", c: ["La châtaigne", "La cerise", "La fraise", "L'abricot"], r: 0, e: "La châtaigne tombe des châtaigniers en automne, d'octobre à novembre." },
    { t: "Saisons", q: "Le litchi est surtout présent sur les étals…", c: ["En juillet", "Autour de décembre", "En avril", "En septembre"], r: 1, e: "Le litchi, venu notamment de Madagascar et de La Réunion, arrive autour des fêtes de fin d'année." },
    { t: "Saisons", q: "À quelle saison mange-t-on le melon français ?", c: ["En hiver", "En été", "Au printemps", "En automne"], r: 1, e: "Le melon français se savoure en été, de juin à septembre." },
    { t: "Saisons", q: "La rhubarbe est de saison…", c: ["Au printemps", "En automne", "En hiver", "Toute l'année"], r: 0, e: "La rhubarbe se récolte au printemps et au début de l'été." },
    { t: "Saisons", q: "Quand récolte-t-on les myrtilles en France ?", c: ["En été", "En hiver", "Au début du printemps", "En novembre"], r: 0, e: "Les myrtilles se récoltent surtout en juillet et en août." },
    { t: "Saisons", q: "Le coing est un fruit…", c: ["De printemps", "D'automne", "D'été", "D'hiver uniquement importé"], r: 1, e: "Le coing se récolte en automne ; trop dur cru, on le cuisine en pâte de coing ou en gelée." },
    { t: "Saisons", q: "Quand le kaki arrive-t-il sur les étals ?", c: ["En automne", "Au printemps", "En été", "En juin"], r: 0, e: "Le kaki se récolte à l'automne, quand les feuilles de l'arbre tombent." },
    { t: "Saisons", q: "Les clémentines de Corse arrivent sur les étals…", c: ["En mai", "En juillet", "Vers novembre", "En août"], r: 2, e: "La récolte de la clémentine de Corse commence vers novembre et dure tout l'hiver." },
    { t: "Saisons", q: "La framboise est un fruit…", c: ["D'hiver", "D'été", "De printemps uniquement", "De novembre"], r: 1, e: "La framboise se récolte de juin à septembre, avec les variétés remontantes en fin de saison." },
    { t: "Saisons", q: "Quand récolte-t-on la noisette ?", c: ["À la fin de l'été", "En mars", "En décembre", "En mai"], r: 0, e: "La noisette se récolte à la fin de l'été, en août et septembre." },
    { t: "Saisons", q: "Les oranges importées d'Espagne sont surtout présentes…", c: ["En hiver", "En été", "En septembre", "En juin"], r: 0, e: "La saison des oranges d'Espagne va en gros de novembre à mai." },
    { t: "Saisons", q: "La figue fraîche se savoure surtout…", c: ["À la fin de l'été", "En janvier", "En mars", "En avril"], r: 0, e: "La figue fraîche se récolte surtout d'août à octobre." },
    { t: "Saisons", q: "La pastèque est le fruit star de…", c: ["L'hiver", "L'été", "L'automne", "Du printemps"], r: 1, e: "Riche en eau, la pastèque se déguste pendant les fortes chaleurs de l'été." },
    { t: "Saisons", q: "Qu'appelle-t-on un fraisier « remontant » ?", c: ["Un fraisier qui produit plusieurs fois dans la saison", "Un fraisier grimpant", "Un fraisier d'hiver", "Un fraisier sauvage"], r: 0, e: "Les variétés remontantes, comme la Mara des bois, produisent du printemps jusqu'aux premières gelées." },
    { t: "Saisons", q: "Qu'est-ce qu'un fruit « de saison » ?", c: ["Un fruit cueilli à maturité au moment naturel de sa récolte", "Un fruit cultivé sous serre chauffée", "Un fruit congelé", "Un fruit importé toute l'année"], r: 0, e: "Un fruit de saison est récolté au moment où la nature le fait mûrir : plus de goût, moins de transport." },
    { t: "Saisons", q: "Pourquoi la saison d'un fruit peut-elle varier d'une année à l'autre ?", c: ["À cause du climat (chaleur, gel, pluie)", "À cause des jours fériés", "À cause de la lune uniquement", "Elle ne varie jamais"], r: 0, e: "Un printemps chaud avance les récoltes, un gel tardif les retarde ou les réduit : la nature ne suit pas le calendrier." },

    // --- Nutrition (suite) ---
    { t: "Nutrition", q: "Quel fruit est le plus riche en eau ?", c: ["La pastèque", "La banane", "L'avocat", "La datte"], r: 0, e: "La pastèque contient environ 92 % d'eau, ce qui en fait le fruit le plus désaltérant." },
    { t: "Nutrition", q: "Lequel de ces fruits est riche en matières grasses ?", c: ["L'avocat", "La pomme", "La fraise", "L'orange"], r: 0, e: "L'avocat est riche en lipides, surtout de « bonnes graisses » insaturées." },
    { t: "Nutrition", q: "Lequel de ces fruits est très riche en fibres ?", c: ["La framboise", "La pastèque", "Le melon", "Le raisin"], r: 0, e: "La framboise apporte plus de 6 g de fibres pour 100 g grâce à ses petits grains." },
    { t: "Nutrition", q: "La couleur orange de l'abricot vient…", c: ["Du bêta-carotène", "Du fer", "Du sel", "Du calcium"], r: 0, e: "Le bêta-carotène donne leur couleur à l'abricot, au melon ou à la mangue ; l'organisme le transforme en vitamine A." },
    { t: "Nutrition", q: "La couleur rouge de la pastèque vient…", c: ["Du lycopène", "De la caféine", "Du magnésium", "Du gluten"], r: 0, e: "Le lycopène, un pigment de la famille des caroténoïdes, colore aussi la tomate." },
    { t: "Nutrition", q: "La couleur bleu-violet des myrtilles vient…", c: ["Des anthocyanes", "Du sucre", "Du sodium", "Des protéines"], r: 0, e: "Les anthocyanes sont des pigments végétaux de la famille des polyphénols, présents aussi dans les cerises et le raisin noir." },
    { t: "Nutrition", q: "Pourquoi une banane tachetée est-elle plus sucrée ?", c: ["Son amidon s'est transformé en sucres", "On lui a ajouté du sucre", "Elle a perdu son eau", "C'est une autre variété"], r: 0, e: "En mûrissant, l'amidon de la banane se transforme en sucres : elle devient plus douce et plus digeste." },
    { t: "Nutrition", q: "Pourquoi une pomme coupée brunit-elle ?", c: ["Elle s'oxyde au contact de l'air", "Elle pourrit instantanément", "Elle perd ses vitamines d'un coup", "À cause de la lumière"], r: 0, e: "Une enzyme réagit avec l'oxygène de l'air : un filet de citron ralentit ce brunissement." },
    { t: "Nutrition", q: "Pourquoi les fruits secs sont-ils plus caloriques que les fruits frais ?", c: ["On leur a retiré l'eau, les sucres sont concentrés", "On leur ajoute toujours de l'huile", "Ils contiennent de la viande", "Ils ne le sont pas"], r: 0, e: "En séchant, le fruit perd son eau : à poids égal, ses sucres et ses calories sont beaucoup plus concentrés." },
    { t: "Nutrition", q: "Le pruneau est…", c: ["Une prune séchée", "Une petite prune sauvage", "Un raisin noir", "Une figue"], r: 0, e: "Le pruneau est une prune séchée, souvent de la variété d'Ente." },
    { t: "Nutrition", q: "Les fruits contiennent-ils du cholestérol ?", c: ["Non, aucun végétal n'en contient", "Oui, beaucoup", "Seulement la banane", "Seulement les agrumes"], r: 0, e: "Le cholestérol est d'origine animale : les fruits n'en contiennent pas." },
    { t: "Nutrition", q: "La vitamine C aide l'organisme à mieux absorber…", c: ["Le fer des végétaux", "Le sel", "La caféine", "Le sucre"], r: 0, e: "La vitamine C améliore l'absorption du fer d'origine végétale." },
    { t: "Nutrition", q: "Quelle maladie touchait autrefois les marins privés de fruits frais ?", c: ["Le scorbut", "La grippe", "La varicelle", "Le rhume des foins"], r: 0, e: "Le scorbut est dû à un manque de vitamine C ; au XVIIIe siècle, le médecin écossais James Lind montra que les agrumes le guérissaient." },
    { t: "Nutrition", q: "Lequel contient encore plus de vitamine C que le kiwi ?", c: ["Le cassis", "La banane", "La poire", "La datte"], r: 0, e: "Le cassis apporte environ deux fois plus de vitamine C que le kiwi pour 100 g." },
    { t: "Nutrition", q: "Quelle quantité de fibres l'Anses recommande-t-elle par jour pour un adulte ?", c: ["Environ 30 g", "Environ 3 g", "Environ 300 g", "Aucune"], r: 0, e: "L'Anses recommande environ 30 g de fibres par jour ; les fruits, légumes et céréales complètes y contribuent." },
    { t: "Nutrition", q: "Quelle enzyme de l'ananas pique un peu la langue ?", c: ["La broméline", "L'insuline", "La pepsine", "La caféine"], r: 0, e: "La broméline de l'ananas attaque légèrement les protéines, d'où ce petit picotement." },
    { t: "Nutrition", q: "Quel fruit contient une enzyme qui empêche la gelée de prendre ?", c: ["Le kiwi frais", "La pomme", "La poire", "La banane"], r: 0, e: "L'actinidine du kiwi frais dégrade la gélatine : on le met donc à part dans les desserts en gelée." },
    { t: "Nutrition", q: "La chaleur de la cuisson…", c: ["Détruit une partie de la vitamine C", "Double la vitamine C", "N'a aucun effet", "Transforme la vitamine C en fer"], r: 0, e: "La vitamine C est sensible à la chaleur et à l'air : un fruit cru en apporte plus qu'un fruit cuit." },
    { t: "Nutrition", q: "Les noix sont particulièrement riches en…", c: ["Oméga-3", "Vitamine C", "Eau", "Sel"], r: 0, e: "Les noix sont l'un des fruits à coque les plus riches en oméga-3, des acides gras utiles à l'organisme." },
    { t: "Nutrition", q: "Un fruit croqué entier ou un jus : lequel rassasie le plus ?", c: ["Le fruit entier", "Le jus", "C'est pareil", "Aucun des deux"], r: 0, e: "Le fruit entier garde ses fibres et demande d'être mâché : il rassasie bien plus qu'un jus." },
    { t: "Nutrition", q: "Environ combien de calories apporte une pomme moyenne ?", c: ["Environ 80 kcal", "Environ 8 kcal", "Environ 400 kcal", "Environ 800 kcal"], r: 0, e: "Une pomme de 150 g apporte environ 80 kcal : une collation légère et rassasiante." },
    { t: "Nutrition", q: "Quel est le fruit le moins calorique parmi ceux-ci ?", c: ["La fraise", "La banane", "La figue", "Le raisin"], r: 0, e: "La fraise n'apporte qu'environ 32 kcal pour 100 g." },
    { t: "Nutrition", q: "Le citron est-il très sucré ?", c: ["Non, il contient très peu de sucre", "Oui, plus que la banane", "Oui, autant que la datte", "Il ne contient que du sucre"], r: 0, e: "Le citron est très acide mais contient peu de sucres, beaucoup moins que la banane ou le raisin." },
    { t: "Nutrition", q: "La datte est un fruit…", c: ["Très sucré et énergétique", "Sans sucre", "Composé surtout d'eau", "Riche en graisses"], r: 0, e: "Riche en sucres naturels, la datte est l'en-cas énergétique des sportifs et des randonneurs." },
    { t: "Nutrition", q: "Quel apport de référence en potassium retient-on pour un adulte ?", c: ["2 000 mg par jour", "20 mg par jour", "20 g par jour", "200 g par jour"], r: 0, e: "L'apport de référence en potassium est de 2 000 mg par jour ; bananes, kiwis et abricots y contribuent." },

    // --- Le juste poids (suite) ---
    { t: "Le juste poids", q: "Combien pèse environ une fraise ?", c: ["Environ 15 à 20 g", "Environ 100 g", "Environ 2 g", "Environ 250 g"], r: 0, e: "Une fraise moyenne pèse 15 à 20 g : il en faut une dizaine pour une portion." },
    { t: "Le juste poids", q: "Combien pèse environ une cerise ?", c: ["Environ 7 g", "Environ 70 g", "Environ 1 g", "Environ 150 g"], r: 0, e: "Une cerise pèse environ 6 à 8 g : une portion de 150 g en compte une vingtaine." },
    { t: "Le juste poids", q: "Combien pèse environ un abricot ?", c: ["Environ 45 g", "Environ 5 g", "Environ 300 g", "Environ 1 kg"], r: 0, e: "Un abricot pèse environ 45 g, soit une vingtaine de calories." },
    { t: "Le juste poids", q: "Combien pèse en moyenne un melon charentais ?", c: ["Environ 800 g à 1 kg", "Environ 100 g", "Environ 5 kg", "Environ 50 g"], r: 0, e: "Un melon charentais pèse en général entre 800 g et 1 kg." },
    { t: "Le juste poids", q: "Combien pèse environ un ananas ?", c: ["Environ 1 à 1,5 kg", "Environ 100 g", "Environ 5 kg", "Environ 300 g"], r: 0, e: "Un ananas pèse le plus souvent entre 1 et 1,5 kg, couronne comprise." },
    { t: "Le juste poids", q: "Combien de pommes moyennes faut-il pour faire un kilo ?", c: ["6 à 7", "2", "15 à 20", "30"], r: 0, e: "Avec une pomme moyenne de 150 g, un kilo compte 6 à 7 pommes." },
    { t: "Le juste poids", q: "Combien pèse environ une orange ?", c: ["Environ 200 g", "Environ 20 g", "Environ 1 kg", "Environ 600 g"], r: 0, e: "Une orange moyenne pèse environ 200 g avec sa peau, autour de 150 g épluchée." },
    { t: "Le juste poids", q: "Combien pèse environ un grain de raisin ?", c: ["Environ 5 g", "Environ 50 g", "Environ 0,1 g", "Environ 100 g"], r: 0, e: "Un grain de raisin pèse environ 5 g : une grappe de 150 g en compte une trentaine." },
    { t: "Le juste poids", q: "Combien pèse environ un citron ?", c: ["Environ 100 g", "Environ 10 g", "Environ 500 g", "Environ 1 kg"], r: 0, e: "Un citron moyen pèse environ 100 g." },
    { t: "Le juste poids", q: "Combien pèse environ un avocat ?", c: ["Environ 200 g", "Environ 20 g", "Environ 1 kg", "Environ 2 kg"], r: 0, e: "Un avocat moyen pèse autour de 200 g." },
    { t: "Le juste poids", q: "Combien pèse environ une figue fraîche ?", c: ["Environ 50 g", "Environ 5 g", "Environ 500 g", "Environ 250 g"], r: 0, e: "Une figue fraîche pèse environ 50 g." },
    { t: "Le juste poids", q: "Combien pèse environ une mangue ?", c: ["Environ 300 à 400 g", "Environ 30 g", "Environ 2 kg", "Environ 5 kg"], r: 0, e: "Une mangue pèse le plus souvent 300 à 400 g." },
    { t: "Le juste poids", q: "Pour combien de personnes une corbeille CoPanier de 13 kg est-elle prévue ?", c: ["35 à 40 personnes", "5 personnes", "100 personnes", "10 personnes"], r: 0, e: "La corbeille de 13 kg convient à 35 à 40 personnes ; au-delà, on combine plusieurs corbeilles." },
    { t: "Le juste poids", q: "Pour combien de personnes une corbeille CoPanier de 10 kg est-elle prévue ?", c: ["25 à 30 personnes", "2 personnes", "80 personnes", "8 personnes"], r: 0, e: "La corbeille de 10 kg convient à 25 à 30 personnes." },
    { t: "Le juste poids", q: "Combien pèse environ un litchi ?", c: ["Environ 20 g", "Environ 200 g", "Environ 1 g", "Environ 80 g"], r: 0, e: "Un litchi pèse environ 20 g, peau comprise." },
    { t: "Le juste poids", q: "Une pastèque pèse généralement…", c: ["Plusieurs kilos", "Environ 100 g", "Environ 500 g", "Environ 50 kg"], r: 0, e: "Une pastèque pèse le plus souvent entre 3 et 10 kg." },

    // --- Producteurs (suite) ---
    { t: "Producteurs", q: "Pourquoi greffe-t-on les pommiers ?", c: ["Pour reproduire fidèlement une variété", "Pour qu'ils poussent sans eau", "Pour avoir des pommes sans peau", "Pour les rendre plus petits uniquement"], r: 0, e: "Un pépin de pomme ne redonne pas la même variété : on greffe donc un rameau de la variété voulue sur un porte-greffe." },
    { t: "Producteurs", q: "Quel insecte allié mange les pucerons dans les vergers ?", c: ["La coccinelle", "Le moustique", "La guêpe", "La mouche"], r: 0, e: "Une coccinelle peut dévorer des dizaines de pucerons par jour : c'est un exemple de lutte biologique." },
    { t: "Producteurs", q: "En quoi consiste la « confusion sexuelle » en arboriculture ?", c: ["Diffuser des phéromones pour désorienter les papillons ravageurs", "Mélanger deux variétés", "Planter les arbres à l'envers", "Récolter la nuit"], r: 0, e: "Les diffuseurs de phéromones empêchent les mâles de trouver les femelles : moins de pontes, moins de vers dans les fruits." },
    { t: "Producteurs", q: "Pourquoi certains arboriculteurs installent-ils des ruches dans leurs vergers ?", c: ["Pour assurer la pollinisation", "Pour vendre de la cire uniquement", "Pour éloigner la grêle", "Pour arroser les arbres"], r: 0, e: "Au moment de la floraison, les abeilles pollinisent les fleurs : sans elles, beaucoup moins de fruits." },
    { t: "Producteurs", q: "Comment protège-t-on parfois les vergers du gel au printemps ?", c: ["Avec des bougies ou une aspersion d'eau", "Avec des parasols", "En arrachant les fleurs", "En coupant les arbres"], r: 0, e: "Bougies, éoliennes ou aspersion d'eau qui forme une gaine de glace protectrice : les arboriculteurs veillent les nuits de gel." },
    { t: "Producteurs", q: "Qu'est-ce que l'agriculture raisonnée ?", c: ["Une agriculture qui limite les traitements au strict nécessaire", "Une agriculture sans aucune machine", "Une agriculture uniquement en serre", "Une agriculture interdite en France"], r: 0, e: "L'agriculture raisonnée cherche à réduire les intrants en n'intervenant que lorsque c'est vraiment utile." },
    { t: "Producteurs", q: "Quelle est la différence entre une AOP et une IGP ?", c: ["L'AOP exige que toutes les étapes se fassent dans la zone ; l'IGP au moins une", "Aucune différence", "L'IGP est réservée au vin", "L'AOP est un label bio"], r: 0, e: "Pour une AOP, production et transformation se font dans l'aire géographique ; pour une IGP, au moins une étape y est réalisée." },
    { t: "Producteurs", q: "Quelle pomme bénéficie d'une AOP dans le Limousin ?", c: ["La Golden", "La Granny Smith", "La Fuji", "La Pink Lady"], r: 0, e: "La pomme du Limousin AOP est une Golden cultivée en altitude, reconnaissable à sa joue rosée." },
    { t: "Producteurs", q: "Quel fruit à coque bénéficie d'une AOP en Isère ?", c: ["La noix de Grenoble", "La noisette de Lyon", "La châtaigne de Paris", "L'amande de Nice"], r: 0, e: "La noix de Grenoble a été le premier fruit à obtenir une appellation d'origine, en 1938." },
    { t: "Producteurs", q: "Quel fruit séché du Lot-et-Garonne bénéficie d'une IGP ?", c: ["Le pruneau d'Agen", "L'abricot sec", "La figue sèche", "Le raisin sec"], r: 0, e: "Le pruneau d'Agen IGP est élaboré à partir de la prune d'Ente." },
    { t: "Producteurs", q: "Quel kiwi bénéficie d'une IGP dans le Sud-Ouest ?", c: ["Le kiwi de l'Adour", "Le kiwi de Bretagne", "Le kiwi d'Alsace", "Le kiwi de Normandie"], r: 0, e: "Le kiwi de l'Adour bénéficie d'une IGP et d'un Label Rouge." },
    { t: "Producteurs", q: "Quel fruit du Périgord bénéficie d'une IGP ?", c: ["La fraise", "La banane", "L'orange", "L'ananas"], r: 0, e: "La fraise du Périgord bénéficie d'une IGP depuis 2004." },
    { t: "Producteurs", q: "Qu'appelle-t-on un « circuit court » ?", c: ["Une vente avec au plus un intermédiaire", "Un verger de petite taille", "Une course de tracteurs", "Une livraison en moins d'une heure"], r: 0, e: "En France, un circuit court désigne une vente directe ou avec un seul intermédiaire entre le producteur et le consommateur." },
    { t: "Producteurs", q: "Comment conserve-t-on les pommes plusieurs mois après la récolte ?", c: ["En chambre froide, parfois pauvre en oxygène", "Au soleil", "Dans l'eau salée", "En les enterrant"], r: 0, e: "En chambre froide à atmosphère contrôlée, les pommes « dorment » et gardent leur croquant pendant des mois." },
    { t: "Producteurs", q: "Quel gaz naturel fait mûrir les fruits ?", c: ["L'éthylène", "L'hélium", "Le néon", "L'azote"], r: 0, e: "L'éthylène, émis notamment par les pommes et les bananes, accélère le mûrissement des fruits voisins." },
    { t: "Producteurs", q: "Comment les bananes sont-elles récoltées ?", c: ["Encore vertes", "Déjà jaunes", "Noires", "Séchées"], r: 0, e: "Les bananes voyagent vertes et finissent de mûrir en mûrisserie, près des lieux de consommation." },
    { t: "Producteurs", q: "Où se trouve le plus grand marché de produits frais au monde ?", c: ["À Rungis", "À Lille", "À Brest", "À Strasbourg"], r: 0, e: "Le marché international de Rungis, au sud de Paris, se présente comme le plus grand marché de produits frais au monde." },
    { t: "Producteurs", q: "Quelle région est réputée pour ses abricots ?", c: ["La vallée du Rhône", "La Normandie", "La Bretagne", "Les Hauts-de-France"], r: 0, e: "La vallée du Rhône, avec le Roussillon et la Provence, fournit l'essentiel des abricots français." },
    { t: "Producteurs", q: "Quelle est la principale période de récolte des pommes en France ?", c: ["De fin août à novembre", "De janvier à mars", "En mai", "En juillet uniquement"], r: 0, e: "Les pommes se récoltent de fin août à novembre selon les variétés, puis sont conservées au froid." },
    { t: "Producteurs", q: "Qu'est-ce qu'un « porte-greffe » ?", c: ["La partie racinaire sur laquelle on greffe la variété", "Un outil de cueillette", "Un panier", "Une variété de poire"], r: 0, e: "Le porte-greffe fournit les racines et influence la vigueur et la taille de l'arbre." },
    { t: "Producteurs", q: "Pourquoi taille-t-on les arbres fruitiers en hiver ?", c: ["Pour aérer l'arbre et favoriser de beaux fruits", "Pour les faire mourir", "Pour récolter le bois uniquement", "C'est interdit"], r: 0, e: "La taille d'hiver, quand l'arbre est au repos, aère la ramure et oriente la production." },
    { t: "Producteurs", q: "Qu'est-ce qu'un pépiniériste ?", c: ["Celui qui produit et vend de jeunes plants d'arbres", "Celui qui retire les pépins des fruits", "Un vendeur de graines de tournesol", "Un apiculteur"], r: 0, e: "Le pépiniériste élève les jeunes arbres, souvent déjà greffés, qui seront plantés dans les vergers." },
    { t: "Producteurs", q: "Combien la France comptait-elle d'exploitations agricoles lors du recensement de 2020 ?", c: ["Environ 390 000", "Environ 3 000", "Environ 39 millions", "Environ 3,9 millions"], r: 0, e: "Le recensement agricole de 2020 dénombrait environ 390 000 exploitations en France métropolitaine." },
    { t: "Producteurs", q: "Les fruits bio peuvent-ils recevoir des traitements ?", c: ["Oui, mais seulement avec des produits autorisés en bio", "Non, aucun traitement", "Oui, tous les pesticides", "Seulement des antibiotiques"], r: 0, e: "L'agriculture biologique interdit les produits chimiques de synthèse mais autorise certains traitements d'origine naturelle." },
    { t: "Producteurs", q: "Qui fait les vendanges ?", c: ["Les viticulteurs et les vendangeurs", "Les maraîchers uniquement", "Les apiculteurs", "Les pêcheurs"], r: 0, e: "Les vendanges, la récolte du raisin, mobilisent viticulteurs et saisonniers à la fin de l'été." },
    { t: "Producteurs", q: "Qu'est-ce qu'un verger « haute tige » ?", c: ["Un verger de grands arbres traditionnels", "Un verger sous serre", "Un verger de fraisiers", "Un verger en pot"], r: 0, e: "Les vergers haute tige, souvent pâturés, sont précieux pour la biodiversité ; les vergers modernes sont plutôt en basse tige." },
    { t: "Producteurs", q: "À quoi sert le goutte-à-goutte dans un verger ?", c: ["À arroser au pied de l'arbre sans gaspiller l'eau", "À traiter contre les insectes", "À faire tomber les fruits", "À chauffer le verger"], r: 0, e: "Le goutte-à-goutte apporte l'eau directement aux racines : un atout face aux sécheresses." },
    { t: "Producteurs", q: "Pourquoi certains producteurs enherbent-ils les rangs du verger ?", c: ["Pour garder l'humidité du sol et favoriser la biodiversité", "Pour nourrir des poissons", "Pour cacher les fruits", "Pour ralentir la croissance des arbres"], r: 0, e: "Un sol couvert garde mieux sa fraîcheur et abrite des insectes utiles." },
    { t: "Producteurs", q: "La France est-elle le premier producteur agricole de l'Union européenne en valeur ?", c: ["Oui", "Non, elle est dernière", "Non, elle ne produit rien", "Elle n'est pas dans l'UE"], r: 0, e: "La France est régulièrement le premier producteur agricole de l'Union européenne en valeur." },

    // --- France et monde (suite) ---
    { t: "France et monde", q: "Quel pays est le premier producteur européen d'agrumes ?", c: ["L'Espagne", "La Suède", "L'Irlande", "La Pologne"], r: 0, e: "L'Espagne est de loin le premier producteur et exportateur d'agrumes d'Europe." },
    { t: "France et monde", q: "Quel pays est le premier producteur mondial de bananes ?", c: ["L'Inde", "La France", "Le Canada", "La Norvège"], r: 0, e: "L'Inde produit le plus de bananes au monde, mais en consomme l'essentiel." },
    { t: "France et monde", q: "Quel pays est le premier exportateur mondial de bananes ?", c: ["L'Équateur", "L'Inde", "La Chine", "L'Islande"], r: 0, e: "L'Équateur est le premier exportateur mondial de bananes." },
    { t: "France et monde", q: "Quel pays produit la majorité des noisettes du monde ?", c: ["La Turquie", "Le Japon", "Le Chili", "Le Canada"], r: 0, e: "La Turquie fournit à elle seule une grande majorité des noisettes produites dans le monde." },
    { t: "France et monde", q: "Quel pays est le premier producteur mondial d'avocats ?", c: ["Le Mexique", "La Suède", "Le Maroc", "La Russie"], r: 0, e: "Le Mexique, berceau de l'avocat, en est le premier producteur mondial." },
    { t: "France et monde", q: "Quel pays est le premier producteur mondial d'oranges ?", c: ["Le Brésil", "L'Islande", "La France", "Le Royaume-Uni"], r: 0, e: "Le Brésil est le premier producteur d'oranges, surtout transformées en jus." },
    { t: "France et monde", q: "D'où la pomme cultivée est-elle originaire ?", c: ["D'Asie centrale", "D'Australie", "D'Amérique du Sud", "D'Afrique du Sud"], r: 0, e: "La pomme cultivée descend d'un pommier sauvage des montagnes d'Asie centrale, au Kazakhstan." },
    { t: "France et monde", q: "D'où la tomate est-elle originaire ?", c: ["D'Amérique du Sud", "D'Italie", "De Chine", "De Grèce"], r: 0, e: "La tomate vient des Andes ; elle n'est arrivée en Europe qu'au XVIe siècle." },
    { t: "France et monde", q: "La fraise que nous mangeons aujourd'hui est née…", c: ["D'un croisement de fraisiers américains réalisé en France au XVIIIe siècle", "En Chine dans l'Antiquité", "En Australie au XXe siècle", "Au Moyen Âge en Angleterre"], r: 0, e: "En 1714, l'officier Amédée Frézier rapporta du Chili un fraisier qui, croisé avec un fraisier de Virginie, donna nos grosses fraises." },
    { t: "France et monde", q: "D'où la pêche est-elle originaire ?", c: ["De Chine", "De Perse", "D'Espagne", "Du Mexique"], r: 0, e: "Malgré son nom latin Prunus persica, la pêche vient de Chine et a transité par la Perse." },
    { t: "France et monde", q: "Qui a obtenu la clémentine, au début du XXe siècle ?", c: ["Le frère Clément, en Algérie", "Un roi de France", "Un botaniste chinois", "Christophe Colomb"], r: 0, e: "La clémentine doit son nom au frère Clément, qui l'aurait obtenue près d'Oran vers 1902." },
    { t: "France et monde", q: "Quel explorateur a fait découvrir l'ananas aux Européens ?", c: ["Christophe Colomb", "Marco Polo", "Jacques Cartier", "Magellan"], r: 0, e: "Christophe Colomb découvrit l'ananas en Guadeloupe en 1493, lors de son deuxième voyage." },
    { t: "France et monde", q: "D'où l'avocat est-il originaire ?", c: ["Du Mexique et d'Amérique centrale", "D'Inde", "De Grèce", "De Norvège"], r: 0, e: "L'avocat était cultivé au Mexique et en Amérique centrale bien avant l'arrivée des Européens." },
    { t: "France et monde", q: "Quel fruit est souvent présenté comme le fruit national de l'Inde ?", c: ["La mangue", "La pomme", "La poire", "La fraise"], r: 0, e: "La mangue, cultivée en Inde depuis des millénaires, en est le fruit emblématique." },
    { t: "France et monde", q: "Quel fruit à l'odeur très forte est interdit dans les transports de Singapour ?", c: ["Le durian", "La fraise", "La pomme", "Le raisin"], r: 0, e: "Le durian, surnommé « roi des fruits », est interdit dans le métro de Singapour à cause de son odeur." },
    { t: "France et monde", q: "D'où la banane est-elle originaire ?", c: ["D'Asie du Sud-Est", "D'Europe du Nord", "D'Amérique du Nord", "D'Antarctique"], r: 0, e: "La banane a été domestiquée en Asie du Sud-Est et en Nouvelle-Guinée il y a des millénaires." },
    { t: "France et monde", q: "Quel pays est le premier producteur mondial de kiwis ?", c: ["La Chine", "La Nouvelle-Zélande", "Le Canada", "La Belgique"], r: 0, e: "La Chine, berceau du kiwi, en est aussi le premier producteur ; la Nouvelle-Zélande est un grand exportateur." },
    { t: "France et monde", q: "Quel fruit les Anglais appellent-ils « strawberry » ?", c: ["La fraise", "La framboise", "La paille", "La mûre"], r: 0, e: "Strawberry signifie fraise ; la framboise se dit raspberry." },
    { t: "France et monde", q: "Comment appelle-t-on la science de la culture des arbres fruitiers ?", c: ["L'arboriculture fruitière (pomologie pour l'étude des fruits)", "L'astronomie", "La géologie", "La zoologie"], r: 0, e: "La pomologie étudie les variétés de fruits ; l'arboriculture fruitière est leur culture." },
    { t: "France et monde", q: "Quelle ville française est surnommée la capitale de la mirabelle ?", c: ["Metz et la Lorraine", "Marseille", "Brest", "Lille"], r: 0, e: "La Lorraine produit l'essentiel des mirabelles du monde, et Metz fête la mirabelle chaque été." },

    // --- Vrai ou faux ---
    { t: "Vrai ou faux", q: "Le bananier est un arbre.", c: ["Vrai", "Faux"], r: 1, e: "Faux : le bananier est une herbe géante ; son « tronc » est formé de feuilles enroulées." },
    { t: "Vrai ou faux", q: "L'avocat est un fruit.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : l'avocat est le fruit de l'avocatier, avec un gros noyau." },
    { t: "Vrai ou faux", q: "Botaniquement, le concombre est un fruit.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : il contient les graines de la plante, comme la tomate, la courgette ou le melon." },
    { t: "Vrai ou faux", q: "La rhubarbe est un fruit.", c: ["Vrai", "Faux"], r: 1, e: "Faux : on mange la tige (le pétiole) de la rhubarbe ; botaniquement, c'est un légume, même si on la cuisine sucrée." },
    { t: "Vrai ou faux", q: "La peau du kiwi se mange.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : bien lavée, elle est comestible et riche en fibres, même si on a l'habitude de l'éplucher." },
    { t: "Vrai ou faux", q: "Une pomme flotte dans l'eau.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : une pomme contient environ un quart d'air, d'où le jeu de la pomme à attraper avec les dents." },
    { t: "Vrai ou faux", q: "Le raisin est dangereux pour les chiens.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : le raisin et les raisins secs peuvent être toxiques pour les chiens." },
    { t: "Vrai ou faux", q: "La cacahuète est une noix.", c: ["Vrai", "Faux"], r: 1, e: "Faux : l'arachide est une légumineuse, de la même famille que les pois et les haricots." },
    { t: "Vrai ou faux", q: "La pastèque est de la même famille que le concombre.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : pastèque, melon, concombre et courgette sont des cucurbitacées." },
    { t: "Vrai ou faux", q: "Une fraise porte environ 200 petits grains à sa surface.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : une fraise compte en moyenne autour de 200 akènes, ses vrais fruits." },
    { t: "Vrai ou faux", q: "La poire continue de mûrir après la cueillette.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : elle est même cueillie avant maturité complète et finit de mûrir à température ambiante." },
    { t: "Vrai ou faux", q: "La cerise continue de mûrir après la cueillette.", c: ["Vrai", "Faux"], r: 1, e: "Faux : la cerise ne mûrit plus une fois cueillie, il faut donc la récolter à point." },
    { t: "Vrai ou faux", q: "Mettre des bananes au réfrigérateur fait noircir leur peau.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : le froid abîme la peau de la banane, qui noircit, même si la chair reste bonne." },
    { t: "Vrai ou faux", q: "Placer un kiwi près d'une pomme le fait mûrir plus vite.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : l'éthylène dégagé par la pomme accélère le mûrissement du kiwi." },
    { t: "Vrai ou faux", q: "Un ananas met plus d'un an à pousser.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : il faut généralement plus d'un an, voire deux, entre la plantation et la récolte d'un ananas." },
    { t: "Vrai ou faux", q: "Les bananes sont très légèrement radioactives.", c: ["Vrai", "Faux"], r: 0, e: "Vrai, mais sans danger : elles contiennent un peu de potassium 40, naturellement présent, comme notre propre corps." },
    { t: "Vrai ou faux", q: "La noix de coco est botaniquement une noix.", c: ["Vrai", "Faux"], r: 1, e: "Faux : c'est une drupe, comme la pêche ou la cerise, avec un noyau très dur." },
    { t: "Vrai ou faux", q: "Les pépins de pomme avalés par accident sont dangereux.", c: ["Vrai", "Faux"], r: 1, e: "Faux : ils contiennent un composé qui peut libérer du cyanure, mais en quantité bien trop faible pour être dangereuse en mangeant une pomme." },
    { t: "Vrai ou faux", q: "La fraise est une baie.", c: ["Vrai", "Faux"], r: 1, e: "Faux : c'est un faux-fruit ; en revanche, la banane et le kiwi sont botaniquement des baies !" },
    { t: "Vrai ou faux", q: "Botaniquement, la banane est une baie.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : pour les botanistes, la banane, le kiwi, le raisin ou la tomate sont des baies." },
    { t: "Vrai ou faux", q: "L'amande est le noyau d'un fruit cousin de la pêche.", c: ["Vrai", "Faux"], r: 0, e: "Vrai : l'amandier est un Prunus, comme le pêcher ; on mange la graine contenue dans son noyau." },
    { t: "Vrai ou faux", q: "Le citron vert et le citron jaune sont exactement le même fruit.", c: ["Vrai", "Faux"], r: 1, e: "Faux : le citron vert (lime) est une espèce différente, plus petite et plus parfumée." },

    // --- Au bureau ---
    { t: "Au bureau", q: "Que signifie QVCT ?", c: ["Qualité de vie et des conditions de travail", "Quantité de viande consommée au travail", "Questionnaire de validation des compétences techniques", "Quota de vacances collectives"], r: 0, e: "La QVCT rassemble les actions pour améliorer le bien-être et l'organisation du travail." },
    { t: "Au bureau", q: "À quel moment de l'année a lieu la Semaine pour la qualité de vie et des conditions de travail ?", c: ["En juin", "En décembre", "En février", "En août"], r: 0, e: "La Semaine de la QVCT a lieu chaque année en juin." },
    { t: "Au bureau", q: "Pourquoi un fruit est-il une bonne collation l'après-midi ?", c: ["Il apporte eau, fibres et sucres naturels", "Il contient beaucoup de graisses", "Il remplace le déjeuner", "Il fait dormir"], r: 0, e: "Eau, fibres, vitamines et sucres accompagnés de fibres : de quoi passer le creux de l'après-midi en douceur." },
    { t: "Au bureau", q: "Chez CoPanier, d'où viennent les fruits des corbeilles ?", c: ["En priorité de producteurs français et locaux, complétés selon les saisons", "Uniquement d'usines", "Uniquement d'Amérique", "D'un congélateur"], r: 0, e: "Nous allons chercher les fruits chaque semaine chez nos producteurs ; agrumes et bananes complètent la gamme selon les saisons." },
    { t: "Au bureau", q: "Dans quoi CoPanier livre-t-il ses fruits ?", c: ["Dans de belles cagettes en bois", "Dans des sacs plastique", "Dans des boîtes de conserve", "En vrac sur le bureau"], r: 0, e: "Nos cagettes en bois donnent envie de se servir… et changent des cartons !" },
    { t: "Au bureau", q: "Le service de livraison de CoPanier est-il avec engagement ?", c: ["Non, il est sans engagement et ajustable", "Oui, 10 ans minimum", "Oui, 5 ans", "Il faut acheter un verger"], r: 0, e: "Le service est sans engagement : les quantités s'ajustent à la présence de votre équipe." },
    { t: "Au bureau", q: "Dans quelle zone CoPanier livre-t-il les entreprises ?", c: ["Paris, l'Île-de-France et le sud de l'Oise", "Uniquement Marseille", "Uniquement la Bretagne", "Le monde entier"], r: 0, e: "Nous livrons Paris, toute l'Île-de-France et le sud de l'Oise (Senlis, Chantilly, Creil…)." },
    { t: "Au bureau", q: "Qui peut proposer une corbeille de fruits dans une entreprise ?", c: ["La direction, le CSE, ou un salarié qui en parle", "Seulement le comptable", "Seulement les stagiaires", "Personne"], r: 0, e: "Souvent, tout commence par un salarié qui en parle ; la direction ou le CSE peuvent ensuite l'offrir à l'équipe." },
    { t: "Au bureau", q: "Où placer la corbeille de fruits pour qu'elle soit appréciée ?", c: ["Dans un lieu de passage, à l'abri du soleil", "Dans un placard fermé", "Au soleil derrière une vitre", "À la cave"], r: 0, e: "Cuisine, espace café, accueil : un lieu de passage, à l'abri de la chaleur, avec une poubelle à côté." },
    { t: "Au bureau", q: "Combien coûte environ une corbeille CoPanier par personne et par semaine ?", c: ["Environ 1,50 à 2,30 € HT", "Environ 50 €", "Environ 0,01 €", "Environ 20 €"], r: 0, e: "Rapportée au nombre de salariés, la corbeille revient à peine au prix d'un café par personne et par semaine." },
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
      var ordre = melanger(q.c.map(function (_, i) { return i; }));
      return { t: q.t, q: q.q, e: q.e, c: ordre.map(function (i) { return q.c[i]; }), r: ordre.indexOf(q.r) };
    });
  }

  function accueil() {
    bloc.innerHTML = '<div class="quiz__carte quiz__accueil">' +
      '<div class="quiz__fruits" aria-hidden="true">🍎🍐🍊🍓🍒🍇</div>' +
      '<h2>Prêt à tester vos connaissances&nbsp;?</h2>' +
      '<p>10 questions tirées au hasard parmi plus de 200, sur les fruits, les saisons, la nutrition, le juste poids et le métier de nos producteurs. Une nouvelle série à chaque partie&nbsp;!</p>' +
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
      '<div class="quiz__partage"><p class="quiz__partage-titre">📸 Défiez vos collègues&nbsp;!</p>' +
      '<p class="petit">Envoyez-leur l\'image de votre note et voyez qui fait mieux.</p>' +
      '<div class="quiz__partage-boutons">' +
      '<button type="button" class="quiz__btn-partage" data-partager>Partager l\'image de ma note</button>' +
      '<button type="button" class="quiz__btn-partage" data-telecharger>Télécharger l\'image</button>' +
      '<a class="quiz__btn-partage" data-whatsapp target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="quiz__btn-partage" data-mail>E-mail</a>' +
      '<a class="quiz__btn-partage" data-linkedin target="_blank" rel="noopener">LinkedIn</a>' +
      '</div></div></div>';
    bloc.querySelector("[data-rejouer]").addEventListener("click", commencer);
    preparerPartage(score);
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

  /* ---------- Image de la note à partager ---------- */
  var URL_QUIZ = "https://copanierdefruits.copanier.fr/quiz-fruits/";
  function texteDefi(n) { return "J'ai eu " + n + "/10 au quiz des fruits de CoPanier 🍎 Et toi, tu fais mieux ? " + URL_QUIZ; }

  function dessiner(n) {
    var c = document.createElement("canvas"); c.width = 1080; c.height = 1080;
    var x = c.getContext("2d");
    x.fillStyle = "#3f6653"; x.fillRect(0, 0, 1080, 1080);
    x.fillStyle = "#2f4e3f"; x.beginPath(); x.arc(1000, 80, 260, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(60, 1040, 220, 0, Math.PI * 2); x.fill();
    x.textAlign = "center";
    x.fillStyle = "#ffd2b8"; x.font = "600 38px Rubik, Arial, sans-serif";
    x.fillText("LE QUIZ DES FRUITS", 540, 190);
    x.font = "84px 'Special Elite', 'Courier New', monospace";
    x.fillStyle = "#ffffff"; x.fillText("Ma note", 540, 320);
    x.fillStyle = "#f4661c"; x.font = "300px 'Special Elite', 'Courier New', monospace";
    x.fillText(String(n), 470, 640);
    x.fillStyle = "#ffffff"; x.font = "110px 'Special Elite', 'Courier New', monospace";
    x.fillText("/10", n === 10 ? 760 : 700, 640);
    x.font = "500 44px Rubik, Arial, sans-serif"; x.fillStyle = "#ffffff";
    x.fillText("Et toi, tu fais mieux ?", 540, 760);
    x.font = "70px serif"; x.fillText("🍎 🍐 🍊 🍓 🍒 🍇", 540, 870);
    x.font = "600 34px Rubik, Arial, sans-serif"; x.fillStyle = "#ffd2b8";
    x.fillText("CoPanier de fruits au bureau", 540, 960);
    x.font = "30px Rubik, Arial, sans-serif"; x.fillStyle = "#ffffff";
    x.fillText("copanierdefruits.copanier.fr/quiz-fruits", 540, 1010);
    return c;
  }

  function preparerPartage(n) {
    var texte = texteDefi(n);
    bloc.querySelector("[data-whatsapp]").href = "https://wa.me/?text=" + encodeURIComponent(texte);
    bloc.querySelector("[data-mail]").href = "mailto:?subject=" + encodeURIComponent("Défi : le quiz des fruits") + "&body=" + encodeURIComponent(texte);
    bloc.querySelector("[data-linkedin]").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(URL_QUIZ);
    var polices = document.fonts && document.fonts.load ? Promise.all([document.fonts.load("84px 'Special Elite'"), document.fonts.load("600 38px Rubik")]) : Promise.resolve();
    var image = polices.catch(function () {}).then(function () {
      return new Promise(function (ok) { dessiner(n).toBlob(function (b) { ok(b); }, "image/png"); });
    });
    var nom = "ma-note-quiz-fruits-" + n + "-sur-10.png";
    function telecharger() {
      image.then(function (b) {
        var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nom;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      });
    }
    bloc.querySelector("[data-telecharger]").addEventListener("click", telecharger);
    bloc.querySelector("[data-partager]").addEventListener("click", function () {
      image.then(function (b) {
        var fichier = new File([b], nom, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
          navigator.share({ files: [fichier], title: "Le quiz des fruits", text: texte }).catch(function () {});
        } else if (navigator.share) {
          navigator.share({ title: "Le quiz des fruits", text: texte, url: URL_QUIZ }).catch(function () {});
        } else {
          telecharger();
        }
      });
    });
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
