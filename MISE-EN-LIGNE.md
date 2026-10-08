# Mise en ligne de CoPanier de fruits au bureau

Tout est **gratuit** et **indépendant de Foncier Stratégie** : un dépôt GitHub à part, un projet Supabase à part, un compte Resend à part.

| Service | Rôle | Coût |
|---|---|---|
| **GitHub Pages** | héberge le site www.copanier.fr | gratuit (dépôt public) |
| **Supabase** | enregistre les demandes de devis et lance l'envoi | gratuit (projet en pause après 7 jours sans activité : un robot GitHub l'en empêche) |
| **Resend** | envoie l'e-mail récapitulatif à contact@copanier.fr | gratuit jusqu'à 3 000 e-mails par mois |
| **Pennylane** | reçoit le **brouillon** de devis, jamais envoyé automatiquement | inclus dans votre abonnement, si celui-ci donne accès à l'API |

Comptez environ 1 h 30. Faites les étapes dans l'ordre.

> Le plan gratuit de Supabase autorise **2 projets** par compte : Foncier Stratégie + CoPanier = 2. Si vous voulez un jour mettre l'outil interne des corbeilles sur Supabase, il faudra un autre compte ou un plan payant.

---

## Étape 1 — Resend (envoi des e-mails)

1. Créez un compte sur **resend.com** avec l'adresse **contact@copanier.fr**. C'est important : sans domaine vérifié, Resend n'envoie qu'à l'adresse du compte.
2. **API Keys → Create API Key**, nom « copanier-site », droit « Sending access ». Copiez la clé, qui commence par `re_`. Elle ne sera plus affichée.
3. *Plus tard, facultatif* : **Domains → Add domain → copanier.fr**, puis ajoutez chez votre registraire les enregistrements DNS indiqués par Resend. Ils concernent le sous-domaine `send`, **sans toucher aux MX** de vos e-mails. Une fois le domaine vérifié, le client recevra aussi un accusé de réception (voir étape 2.5).

## Étape 2 — Supabase (base des demandes) ✅ fait le 7 octobre 2026

Compte Supabase **contact@copanier.fr**, organisation **COPANIER** (Free), projet **copanier** (`eykdcoqdhllbigxujgsl`, région Paris).

- Table `devis_copanier` créée, puis durcie : `supabase/migrations/`, deux fichiers exécutés dans l'ordre.
- Fonction **copanier-devis** déployée. « Verify JWT » est désactivé, comme le recommande Supabase avec les nouvelles clés : la fonction se protège elle-même, car elle ne traite qu'une demande réellement enregistrée, de moins de 30 minutes, une seule fois.
- **Sécurité** : le public peut seulement déposer une demande ; lecture, modification et suppression sont refusées (vérifié). Les tables ne sont pas exposées par défaut, la protection RLS est automatique, les inscriptions sont désactivées, et le Security Advisor affiche **0 erreur, 0 avertissement**.
- Le site est déjà configuré : URL du projet et clé « publishable » (publique) dans `site/js/main.js`.

**Il vous reste :** Edge Functions → **Secrets** → Name `RESEND_API_KEY`, Value = votre clé Resend (`re_…`) → **Save**.

*Plus tard* : quand copanier.fr sera vérifié dans Resend, ajoutez le secret `EXPEDITEUR` = `CoPanier de fruits au bureau <noreply@copanier.fr>` (accusé de réception automatique au client).

**Voir les demandes reçues** : Table Editor → `devis_copanier`. Deux lignes « TEST CoPanier » datent des essais du 7 octobre : vous pouvez les supprimer.

## Étape 3 — Pennylane (brouillon de devis)

Le devis est créé en **brouillon, sans envoi**, au même format que vos devis habituels. Vous le retrouvez dans Pennylane → Ventes → Devis, vous l'ajustez, puis vous l'envoyez vous-même.

**Ce qu'il faut faire, une seule fois :**
1. Pennylane → **Paramètres → Connectivité → Développeurs → Générer un Token API**.
   - Nom : `site-copanier-devis`
   - Droits : **Clients** (lecture et écriture), **Devis** (lecture et écriture), **Produits** (lecture). Rien d'autre.
2. Copiez le jeton, puis dans Supabase → **Edge Functions → Secrets → Add new secret** : Name `PENNYLANE_API_TOKEN`, Value = le jeton → **Save**.

Les produits sont retrouvés par leur libellé. Ne renommez donc pas « Corbeilles de fruits (environ 7kg) », « Corbeilles de Fruits (environ 13 kg) », « Corbeilles de fruits », « Frais de livraison » et « Livraison offerte ».

**Ce que fait l'automatisme :**
- Il cherche le client dans Pennylane, par son e-mail puis par le nom de l'entreprise. S'il ne le trouve pas, il le crée avec l'adresse de l'entreprise, reconnue grâce à la Base Adresse Nationale.
- Il choisit la corbeille selon le nombre de personnes : jusqu'à 22 personnes, 7 kg à 34,85 € ; jusqu'à 32, 10 kg à 48,33 € ; jusqu'à 42, 13 kg à 61 €. Au-delà, il met plusieurs corbeilles de 13 kg.
- **Formule chaque semaine, toutes les 2 semaines ou autre récurrence :**
  - objet du devis : « Livraison hebdomadaire de Corbeilles de fruits-Entreprise Ville » ;
  - description de la corbeille : vos conditions habituelles (prix par livraison, dates non livrées, virement mensualisé, corbeille perdue 20 € HT, révision annuelle, préavis de deux semaines) ;
  - ligne « Livraison offerte » avec l'adresse.
- **Formule ponctuelle :**
  - objet du devis : « Corbeilles de fruits frais- Livraison ponctuelle -Entreprise Ville » ;
  - ligne « Frais de livraison » avec « Livraison prévue le : date à convenir », virement et corbeille perdue.
- Échéance du devis : 30 jours.
- **Il n'envoie jamais le devis.** Si quelque chose bloque (adresse illisible, jeton absent…), l'e-mail que vous recevez l'indique en rouge, et vous créez le devis à la main.

## Étape 4 — GitHub (le site)

1. Connectez-vous à GitHub avec le compte **Copanier** (celui de Foncier Stratégie convient, les dépôts restent séparés). **New repository** : nom `copanier-fruits-au-bureau`, **Public**, sans README.
2. Envoyez **tout le dossier `site-copanier`**. Le dossier `sauvegardes/` est exclu automatiquement. Le plus simple est **GitHub Desktop** : File → Add local repository → choisir `site-copanier` → « create a repository » → Publish. Ou bien, dans un terminal ouvert dans le dossier :
   ```
   git init -b main
   git add .
   git commit -m "Site CoPanier de fruits au bureau"
   git remote add origin https://github.com/Copanier/copanier-fruits-au-bureau.git
   git push -u origin main
   ```
   ⚠️ N'importez pas les fichiers un par un via le site GitHub : il faut **tous** les fichiers, sinon le site sera cassé.
3. Dans le dépôt, allez dans **Settings → Pages** :
   - Source : **GitHub Actions**
   - Custom domain : **www.copanier.fr** → Save
   - Une fois le DNS en place (étape 5), cochez **Enforce HTTPS**
4. **Settings → Secrets and variables → Actions → Variables**, ajoutez `SUPABASE_URL` = `https://eykdcoqdhllbigxujgsl.supabase.co` et `SUPABASE_ANON_KEY` = la clé publishable (celle de `site/js/main.js`). Le robot « Garder Supabase actif » les utilise.
5. Onglet **Actions** : « Publier le site » doit passer au vert en 1 minute environ.

Ensuite, chaque modification poussée sur GitHub (dossier `site/`) met le site à jour toute seule.

## Étape 5 — Nom de domaine copanier.fr

Chez le registraire de copanier.fr (Wix, OVH, IONOS…), dans la **zone DNS** :

| Type | Nom | Valeur |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | copanier.github.io |

Supprimez les anciens enregistrements A et CNAME `www` qui pointaient vers Wix. **Ne touchez à aucun enregistrement MX ni TXT existant**, sinon contact@copanier.fr ne recevra plus d'e-mails. Le changement prend effet entre quelques minutes et 24 h.

Les **225 anciennes adresses** du site Wix (recettes, produits, catalogue) sont redirigées vers les nouvelles pages : Google transfère ainsi l'ancienneté du site. Arrêtez l'abonnement Wix **seulement après** avoir vérifié que www.copanier.fr affiche le nouveau site, et gardez le nom de domaine.

## Étape 6 — Vérifications

- [ ] www.copanier.fr affiche le nouveau site, en HTTPS
- [ ] Une ancienne adresse, par exemple www.copanier.fr/pages/notre-concept, mène à « Notre démarche »
- [ ] Une demande de devis d'essai arrive sur contact@copanier.fr
- [ ] Le brouillon apparaît dans Pennylane → Ventes → Devis, **non envoyé** (supprimez ensuite le devis et le client d'essai)
- [ ] Google Search Console : ajoutez www.copanier.fr (propriété existante de l'ancien site, s'il y en a une) et soumettez `https://www.copanier.fr/sitemap.xml`
- [ ] Bing Webmaster Tools : importez depuis Search Console

## Sécurité de vos comptes (5 minutes, à faire absolument)

Activez la **double authentification (2FA)** sur les trois comptes : Supabase (Account → Security), Resend (Settings → Security) et GitHub (Settings → Password and authentication). Ne communiquez jamais la clé Resend, la clé « secret / service_role » de Supabase ni le jeton Pennylane : ils se saisissent uniquement dans Supabase → Secrets.
