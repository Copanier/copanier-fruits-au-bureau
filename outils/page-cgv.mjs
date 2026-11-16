// Génère la page /conditions-generales-de-vente/ (ventes en ligne aux particuliers : sapins de Noël)
// node outils/page-cgv.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ecrirePage, ajouterAuPlan } from './gabarit.mjs';

const config = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'sapins', 'config.json'), 'utf8'));
const dateLongue = (iso) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const vagues = config.vagues.map((v) => `<li>commandes jusqu'au ${dateLongue(v.fin_commandes)} à minuit&nbsp;: livraison le ${v.libelle_livraison} ${config.annee}&nbsp;;</li>`).join('\n          ');
const tailles = config.sapins.map((s) => `${s.taille} (${s.prix}&nbsp;€ TTC)`).join(', ');

const contenu = `    <section class="section">
      <article class="conteneur article">
        <p><em>Version en vigueur au ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.</em></p>

        <h2>1. Objet et champ d'application</h2>
        <p>Les présentes conditions générales de vente (CGV) s'appliquent aux ventes en ligne conclues sur le site copanierdefruits.copanier.fr entre la société COMPTOIR DES FERMIERS (ci-après «&nbsp;COPANIER&nbsp;») et toute personne physique agissant à titre personnel (ci-après «&nbsp;le Client&nbsp;»), notamment la vente de sapins de Noël livrés sur le lieu de travail du Client. Les prestations de livraison de corbeilles de fruits aux entreprises font l'objet d'un devis et de conditions propres.</p>
        <p>Toute commande implique l'acceptation sans réserve des présentes CGV, que le Client reconnaît avoir lues avant de valider sa commande.</p>

        <h2>2. Vendeur</h2>
        <ul>
          <li>COMPTOIR DES FERMIERS, nom commercial COPANIER, société par actions simplifiée unipersonnelle (SASU) au capital de 1&nbsp;000&nbsp;€</li>
          <li>Siège social&nbsp;: 3 route de Forfry, 77178 Oissery</li>
          <li>RCS Meaux 904&nbsp;666&nbsp;724 – SIRET 904&nbsp;666&nbsp;724&nbsp;00029 – TVA intracommunautaire FR33&nbsp;904&nbsp;666&nbsp;724</li>
          <li>Contact&nbsp;: <a href="mailto:contact@copanier.fr">contact@copanier.fr</a></li>
        </ul>

        <h2>3. Accès à la vente</h2>
        <p>La vente de sapins est réservée aux collaborateurs des entreprises partenaires de COPANIER. L'accès se fait avec le code entreprise communiqué par l'employeur ou par COPANIER. Ce code permet d'afficher les produits, les prix, l'adresse et les dates de livraison propres à l'entreprise.</p>

        <h2>4. Produits</h2>
        <p>Les sapins proposés sont des sapins Nordmann naturels coupés, vendus dans les tailles suivantes&nbsp;: ${tailles}. Les tailles sont indicatives&nbsp;: s'agissant de produits naturels, la forme, la densité et la hauteur exacte peuvent varier légèrement d'un arbre à l'autre. Les photographies et illustrations ne sont pas contractuelles.</p>

        <h2>5. Prix</h2>
        <p>Les prix sont indiqués en euros, toutes taxes comprises (TVA à ${config.tva}). Ils incluent la livraison sur le lieu de travail du Client. COPANIER peut modifier ses prix à tout moment&nbsp;; le prix applicable est celui affiché au moment de la validation de la commande.</p>

        <h2>6. Commande</h2>
        <p>Le Client saisit son code entreprise, choisit une date de livraison et la taille de son sapin, puis est dirigé vers la page de paiement sécurisée de notre prestataire Stripe, où il renseigne ses coordonnées (nom, adresse e-mail, téléphone, service ou étage) et règle sa commande. La commande est ferme dès la validation du paiement. Une confirmation et un reçu sont envoyés par e-mail.</p>
        <p>Les commandes sont ouvertes jusqu'aux dates limites suivantes&nbsp;:</p>
        <ul>
          ${vagues}
        </ul>
        <p>Passé une date limite, la livraison correspondante n'est plus proposée.</p>

        <h2>7. Paiement</h2>
        <p>Le paiement s'effectue en totalité à la commande, par carte bancaire, via la plateforme sécurisée Stripe. COPANIER n'a jamais accès aux données bancaires du Client. En cas de refus du paiement, la commande n'est pas enregistrée.</p>

        <h2>8. Livraison</h2>
        <p>Le sapin est livré à l'adresse de l'entreprise du Client, à la date choisie lors de la commande, au point de dépôt convenu avec l'entreprise (accueil, hall ou salle de pause). Le Client le récupère sur place le jour de la livraison.</p>
        <p>La livraison dans une entreprise est organisée à partir de ${config.seuil_par_entreprise}&nbsp;sapins commandés dans cette entreprise pour une même date. Si ce nombre n'est pas atteint, COPANIER en informe le Client et lui propose, à son choix, un point de retrait proche, une autre date de livraison ou le remboursement intégral de sa commande.</p>
        <p>En cas d'événement indépendant de sa volonté empêchant la livraison à la date prévue (intempéries, défaillance du fournisseur, fermeture du site), COPANIER prévient le Client dans les meilleurs délais et propose une nouvelle date ou le remboursement intégral.</p>

        <h2>9. Annulation et droit de rétractation</h2>
        <p>Le Client peut annuler gratuitement sa commande, par e-mail à <a href="mailto:contact@copanier.fr">contact@copanier.fr</a>, jusqu'à la date limite de commande correspondant à sa date de livraison. Il est alors remboursé intégralement sur la carte utilisée, dans un délai de 14 jours.</p>
        <p>Après cette date, le sapin est commandé auprès de notre producteur et coupé pour le Client. Conformément à l'article L221-28, 4° du Code de la consommation, le droit de rétractation ne peut alors plus être exercé, s'agissant d'un bien susceptible de se détériorer rapidement.</p>

        <h2>10. Conformité et réclamations</h2>
        <p>Le Client est invité à vérifier son sapin dès sa récupération. Un sapin abîmé ou non conforme à la taille commandée est remplacé ou remboursé, sur signalement à <a href="mailto:contact@copanier.fr">contact@copanier.fr</a> dans les 48&nbsp;heures suivant la livraison, si possible accompagné d'une photo.</p>
        <p>Le Client bénéficie en tout état de cause de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil).</p>

        <h2>11. Responsabilité</h2>
        <p>Une fois le sapin remis au point de dépôt convenu le jour de la livraison, sa garde est transférée au Client. COPANIER ne saurait être tenue responsable d'un dommage résultant d'une mauvaise conservation ou installation du sapin après sa remise.</p>

        <h2>12. Données personnelles</h2>
        <p>Les données collectées lors de la commande (nom, e-mail, téléphone, service ou étage, entreprise) sont utilisées uniquement pour traiter, livrer et facturer la commande, et pour répondre aux demandes du Client. Le paiement est traité par Stripe. Pour en savoir plus et exercer vos droits, consultez notre <a href="/politique-de-confidentialite/">politique de confidentialité</a>.</p>

        <h2>13. Médiation et litiges</h2>
        <p>En cas de difficulté, le Client est invité à contacter d'abord COPANIER à <a href="mailto:contact@copanier.fr">contact@copanier.fr</a> afin de rechercher une solution amiable. Conformément aux articles L611-1 et suivants du Code de la consommation, COMPTOIR DES FERMIERS adhère au <strong>Service du Médiateur du e-commerce de la FEVAD</strong> (Fédération du e-commerce et de la vente à distance), 60 rue La Boétie, 75008 Paris – <a href="https://www.mediateurfevad.fr" target="_blank" rel="noopener">www.mediateurfevad.fr</a>. Après une démarche écrite préalable auprès de COPANIER restée sans solution, le Client peut saisir gratuitement ce médiateur pour tout litige de consommation.</p>
        <p>Les présentes CGV sont soumises au droit français. À défaut de solution amiable, les tribunaux français sont compétents dans les conditions prévues par la loi.</p>
      </article>
    </section>`;

ecrirePage({
  chemin: '/conditions-generales-de-vente/',
  titre: 'Conditions générales de vente | CoPanier',
  description: 'Conditions générales de vente de COPANIER (COMPTOIR DES FERMIERS) pour les ventes en ligne aux particuliers, dont les sapins de Noël livrés au bureau.',
  ariane: [['Conditions générales de vente']],
  h1: 'Conditions générales de vente',
  chapo: 'Ventes en ligne aux particuliers, notamment les sapins de Noël livrés sur le lieu de travail.',
  contenu,
});
ajouterAuPlan('/conditions-generales-de-vente/');
console.log('Page /conditions-generales-de-vente/ générée');
