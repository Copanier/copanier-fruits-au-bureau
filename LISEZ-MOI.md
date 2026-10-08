# Site internet COPANIER : mode d'emploi

Site vitrine statique : du HTML et du CSS, sans base de données ni abonnement. Il s'héberge n'importe où, et les textes se modifient directement dans le navigateur.

## Contenu du dossier

| Élément | Rôle |
|---|---|
| `Modifier le site.bat` | **Double-cliquez dessus** pour ouvrir le site et modifier les textes |
| `site/` | Le site lui-même : c'est ce dossier que GitHub publie. |
| `outils/` | L'outil de modification (utilisé seulement sur votre ordinateur). |
| `supabase/` | La base des demandes de devis et la fonction e-mail + Pennylane. |
| `.github/` | Les robots GitHub : publication du site, maintien de Supabase actif. |
| `MISE-EN-LIGNE.md` | Le guide de mise en ligne pas à pas. |
| `sauvegardes/` | Créé automatiquement : une copie de chaque page avant modification |

## 1. Modifier les textes : sans Bloc-notes

1. Double-cliquez sur **`Modifier le site.bat`**. Une fenêtre noire s'ouvre, puis le site s'affiche dans votre navigateur. **Laissez la fenêtre noire ouverte.**
2. Cliquez sur n'importe quel texte (titre, paragraphe, question de la FAQ, prix, bouton…) et tapez votre modification.
3. Cliquez sur **Enregistrer** dans la barre en bas de l'écran, ou faites `Ctrl + S`.
4. Pour changer de page, utilisez le menu « Page » de la barre.
5. Le bouton **Titre Google** permet de modifier le titre et la description qui s'affichent dans les résultats Google, avec un aperçu.
6. Quand vous avez fini, fermez la fenêtre noire, puis envoyez les changements sur GitHub (partie 3).

En cas d'erreur, l'ancienne version de chaque page se trouve dans `sauvegardes/`, classée par date et heure.

L'outil a besoin de Node.js, déjà installé sur cet ordinateur. Sur un autre ordinateur, installez-le depuis nodejs.org.

**Ce qui ne se modifie pas avec l'outil** : le menu et le pied de page, communs à toutes les pages. Pour les changer, utilisez la méthode Bloc-notes ci-dessous avec « Rechercher et remplacer » dans tous les fichiers.

### Méthode manuelle (Bloc-notes ou VS Code)

- **Ouvrir le Bloc-notes** : touche Windows, tapez « Bloc-notes », Entrée. Ou bien faites un clic droit sur un fichier `index.html`, puis **Ouvrir avec → Bloc-notes**.
- **Mieux : Visual Studio Code** (gratuit, code.visualstudio.com). Faites `Fichier → Ouvrir le dossier` et choisissez `site-copanier`. `Ctrl + Maj + H` remplace un texte dans toutes les pages d'un coup (adresse e-mail, prix…).
- Chaque page est un fichier `index.html` rangé dans un dossier dont le nom correspond à l'adresse : `site/faq/index.html` correspond à la page FAQ, par exemple.
- Ne modifiez que le texte situé **entre** les balises. Par exemple, dans `<p>Votre texte</p>`, ne changez que « Votre texte ».

### Autres réglages

- **Prix** : modifiez le tableau des tarifs avec l'outil. Le simulateur de quantité relit automatiquement ce tableau. Les prix figurent aussi dans le bloc `application/ld+json` en haut de l'accueil et de la page tarifs, qui est lu par Google : mettez-le à jour dans le Bloc-notes.
- **Adresse qui reçoit les devis** : dans `supabase/functions/copanier-devis/index.ts` (ligne `DESTINATAIRE`). Dans les pages, cherchez `contact@copanier.fr`.
- **Prix dans Pennylane** : les brouillons reprennent les prix de vos 3 produits Pennylane. Si vos tarifs changent, modifiez-les aussi dans Pennylane.
- **Couleurs** : `site/css/style.css`, variables `--vert` et `--orange` en haut du fichier.
- **Photo du fondateur** : déposez `pierre-fondateur.jpg` dans `site/images/`, puis suivez la consigne en commentaire dans `site/index.html`, section « FONDATEUR ».
- **Fruits du mois** (accueil) : modifiez-les directement avec l'outil. En mode modification, tous les mois s'affichent les uns sous les autres.

## Blog : ajouter un article

Publier régulièrement un article améliore le référencement. Le blog se trouve sur **/blog/**, le guide des fruits sur **/blog/fruits/** (22 fiches avec calories et vitamines) et le calendrier sur **/calendrier-fruits-de-saison/**.

Pour créer un article, ouvrez un terminal dans le dossier `site-copanier` :

```
node outils/nouvel-article.mjs "Titre de l'article" "Thème"
```

La page est créée avec un texte provisoire. Elle est ajoutée en tête de la page Blog et dans le plan du site. Rédigez ensuite le texte avec « Modifier le site.bat », puis envoyez les changements sur GitHub. Vous pouvez aussi simplement demander à Claude de rédiger et publier l'article.

## 2. La demande de devis

Les boutons « Demander un devis » ouvrent un formulaire. La demande est enregistrée dans le projet **Supabase de CoPanier** (indépendant de Foncier Stratégie). Ensuite :
1. un **brouillon de devis** est créé dans **Pennylane**, sans envoi au client ;
2. un **e-mail mis en page** arrive sur contact@copanier.fr, avec le lien vers ce brouillon.

Tant que Supabase n'est pas branché, le formulaire propose l'envoi par e-mail (messagerie, Gmail, Outlook ou copier-coller) : aucune demande n'est perdue.

La mise en route complète (Resend, Supabase, Pennylane, GitHub, nom de domaine) est décrite pas à pas dans **[MISE-EN-LIGNE.md](MISE-EN-LIGNE.md)**.

## 3. Mettre le site en ligne

Le site est hébergé gratuitement sur **GitHub Pages**. Il remplace l'ancien site Wix à la même adresse, **www.copanier.fr**, pour garder son ancienneté auprès de Google. Les 225 anciennes adresses Wix ont chacune une page de redirection dans `site/` (dossiers `post/`, `product/`, `store/`, `pages/`, `category/`, `feed/`) : ne les supprimez pas. Procédure : **[MISE-EN-LIGNE.md](MISE-EN-LIGNE.md)**.

**Après une modification des textes**, une fois le site sur GitHub : envoyez les changements (GitHub Desktop → Commit → Push). Le site se met à jour tout seul en une minute environ.

## 4. Référencement : les étapes indispensables après la mise en ligne

Le site est optimisé techniquement : balises, données structurées, pages locales, FAQ, articles, vitesse, affichage mobile. Personne ne peut pour autant garantir la 1re place sur Google : le classement se construit sur plusieurs semaines. Voici ce qui fera la différence, par ordre d'importance :

1. **Google Search Console** (search.google.com/search-console) : ajoutez `www.copanier.fr`, puis soumettez `https://www.copanier.fr/sitemap.xml`. Google découvre ainsi toutes les pages.
2. **Fiche Google Business Profile** (business.google.com) : créez la fiche « COPANIER », catégorie « Service de livraison de fruits » ou « Grossiste en fruits et légumes ». Indiquez les zones desservies (Paris, les départements d'Île-de-France, l'Oise), le site web et des photos. C'est elle qui vous fait apparaître sur Google Maps et dans les résultats locaux.
3. **Avis Google** : demandez à vos clients satisfaits de laisser un avis. C'est le 1er facteur du référencement local. Les concurrents en affichent des milliers.
4. **Bing Webmaster Tools** (bing.com/webmasters) : importez le site depuis Search Console. Bing alimente aussi ChatGPT et Copilot.
5. **Liens entrants** : inscrivez-vous sur les annuaires professionnels (Pages Jaunes, annuaires de la CCI, de votre commune, des producteurs locaux) et demandez un lien à vos partenaires agriculteurs.
6. **Publiez régulièrement** : un nouvel article « Conseils » par mois, en copiant la structure d'un article existant. Sujets possibles : le CSE et les fruits, les fruits d'automne, l'organisation d'un petit-déjeuner d'équipe, etc.

## 5. À vérifier ou compléter

- [ ] **Mentions légales** : remplacer les informations entre [crochets] (SIRET, adresse). Hébergeur : GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis. C'est une obligation légale.
- [ ] **Zones de livraison** : vérifier les villes citées sur les 10 pages de zones (75, 92, 93, 94, 77, 78, 91, 95, sud de l'Oise).
- [ ] **Logos clients** (Chanel, L'Oréal, SNCF…) : ils sont repris de la plaquette. Assurez-vous d'avoir l'accord de ces entreprises pour les citer publiquement.
- [ ] **Photo du fondateur** : voir la partie 1.
