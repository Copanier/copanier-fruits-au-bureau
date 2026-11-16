// =========================================================
// Génère la page /sapins-de-noel/ (vente de sapins aux collaborateurs des entreprises clientes).
//
//   node outils/page-sapins.mjs
//
// - Réglages publics (dates, tailles, prix, liens de paiement Stripe) : outils/sapins/config.json
// - Entreprises et codes (PRIVÉ, jamais publié) : outils/sapins/entreprises.local.json
//   Un code est créé automatiquement pour chaque entreprise qui n'en a pas.
// - Les informations de chaque entreprise sont CHIFFRÉES dans la page avec son code
//   (AES-GCM, clé dérivée du code par PBKDF2) : sans le bon code, la page ne révèle
//   ni le nom des entreprises, ni les codes, ni les prix, ni les liens de paiement.
// - Fichiers produits pour vous (privés) dans outils/sapins/ :
//   codes-a-envoyer.local.csv (code + lien direct à envoyer à chaque entreprise)
//   entreprises.local.sql (à exécuter dans Supabase pour les récapitulatifs de commandes)
// =========================================================
import fs from 'node:fs';
import path from 'node:path';
import { webcrypto as crypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ecrirePage, ajouterAuPlan, DOMAINE } from './gabarit.mjs';

const DOSSIER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sapins');
const config = JSON.parse(fs.readFileSync(path.join(DOSSIER, 'config.json'), 'utf8'));
const fichierEntreprises = path.join(DOSSIER, 'entreprises.local.json');
const entreprises = fs.existsSync(fichierEntreprises) ? JSON.parse(fs.readFileSync(fichierEntreprises, 'utf8')) : [];

// --- Codes : 4 chiffres tirés au hasard, uniques, sans suites évidentes (1234, 1111, 2026…)
const normaliser = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function codeEvident(c) {
  const d = c.split('').map(Number);
  const suite = (pas) => d.every((x, i) => i === 0 || x === d[i - 1] + pas);
  return new Set(d).size <= 2 || suite(1) || suite(-1) || /^(19|20)\d\d$/.test(c);
}
// Code = 3 premières lettres du nom de l'entreprise + 4 chiffres (ex. SYM4379) ; majuscules ou minuscules acceptées
const prefixe = (nom) => (nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '') + 'XXX').slice(0, 3);
function nouveauCode(nom, existants) {
  const chiffresPris = new Set([...existants].map((c) => c.slice(-4)));
  for (;;) {
    const chiffres = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, '0');
    if (!chiffresPris.has(chiffres) && !codeEvident(chiffres)) return prefixe(nom) + chiffres;
  }
}
const existants = new Set(entreprises.map((e) => normaliser(e.code)).filter(Boolean));
let codesCrees = 0;
for (const e of entreprises) {
  if (!e.entreprise) continue;
  // anciens codes à 4 chiffres : on garde les chiffres et on ajoute les 3 lettres
  if (/^[0-9]{4}$/.test(e.code || '')) { e.code = prefixe(e.entreprise) + e.code; codesCrees++; }
  if (!e.code) { e.code = nouveauCode(e.entreprise, existants); existants.add(normaliser(e.code)); codesCrees++; }
}
if (codesCrees) fs.writeFileSync(fichierEntreprises, JSON.stringify(entreprises, null, 2) + '\n');

// --- Chiffrement (identique au déchiffrement de site/js/sapins.js)
const ITERATIONS = 150000;
const b64 = (u8) => Buffer.from(u8).toString('base64');
// Un « sel » commun, renouvelé à chaque génération : le navigateur ne calcule la clé qu'une fois par code saisi
const SEL = crypto.getRandomValues(new Uint8Array(16));
async function chiffrer(code, objet) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normaliser(code)), 'PBKDF2', false, ['deriveKey']);
  const cle = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: SEL, iterations: ITERATIONS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const donnees = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, new TextEncoder().encode(JSON.stringify(objet))));
  return { i: b64(iv), d: b64(donnees) };
}

const vagues = config.vagues.map((v) => ({ id: v.id, fin: v.fin_commandes, livraison: v.libelle_livraison }));
const sapins = config.sapins.map((s) => ({ taille: s.taille, prix: s.prix, pour: s.pour, lien: s.lien_paiement || '' }));
// Boissons du producteur (champagne…) : seuls les champs utiles à la page, sans les prix d'achat
const b = config.boissons || { produits: [] };
const boissons = { producteur: b.producteur || '', presentation: b.presentation || '', tva: b.tva || '20 %', produits: b.produits.filter((x) => x.propose !== false).map((x) => ({ nom: x.nom, categorie: x.categorie, detail: x.detail, fiche: x.fiche || null, coeur: !!x.coup_de_coeur, contenance: x.contenance || '', image: x.image, l: x.largeur, h: x.hauteur, prix: x.prix_ttc || null, lien: x.lien_paiement || '' })) };
const actives = entreprises.filter((e) => e.entreprise && e.code);
const coffre = [];
for (const e of actives) {
  coffre.push(await chiffrer(e.code, {
    entreprise: e.entreprise,
    adresse: e.adresse_livraison || '',
    reference: normaliser(e.code),
    vagues: vagues.filter((v) => !e.vagues || e.vagues.includes(v.id)),
    sapins,
    sans_pied: config.sans_pied || null,
    boissons,
  }));
}
// mélange : l'ordre ne trahit pas l'ordre du fichier
coffre.sort(() => Math.random() - 0.5);

// --- Fichiers privés pour vous
const page = `${DOMAINE}/sapins-de-noel/`;
const csv = ['Entreprise;Contact;Adresse de livraison;Vagues;Code;Lien direct']
  .concat(actives.map((e) => [e.entreprise, e.contact || '', e.adresse_livraison || '', (e.vagues || vagues.map((v) => v.id)).join(' + '), e.code, `${page}#code=${e.code}`]
    .map((x) => /[;"\n]/.test(x) ? `"${String(x).replace(/"/g, '""')}"` : x).join(';')));
fs.writeFileSync(path.join(DOSSIER, 'codes-a-envoyer.local.csv'), '﻿' + csv.join('\r\n') + '\r\n');
const sql = ['-- Entreprises de la vente de sapins (à exécuter dans Supabase → SQL Editor). Fichier privé.']
  .concat(actives.map((e) => `insert into public.sapins_entreprises (reference, entreprise, adresse, contact) values (${[normaliser(e.code), e.entreprise, e.adresse_livraison || '', e.contact || ''].map((x) => `'${String(x).replace(/'/g, "''")}'`).join(', ')}) on conflict (reference) do update set entreprise = excluded.entreprise, adresse = excluded.adresse, contact = excluded.contact;`));
fs.writeFileSync(path.join(DOSSIER, 'entreprises.local.sql'), sql.join('\n') + '\n');

// --- Page
const euros = (n) => `${n}&nbsp;€`;
const premiere = vagues[0], derniere = vagues[vagues.length - 1];
const contenu = `    <section class="section">
      <div class="conteneur sapins">
        <div class="sapins__intro">
          <p class="surtitre">Noël ${config.annee} au bureau</p>
          <h2>Votre sapin de Noël livré au bureau</h2>
          <p>Des <strong>sapins Nordmann</strong> fraîchement coupés, livrés directement dans votre entreprise. Vous le commandez en ligne, vous le payez par carte, et vous le récupérez au bureau le jour de la livraison.</p>
          <ul class="liste-coches">
            <li>5 tailles, de 100 à 250&nbsp;cm, <strong>livrés avec leur pied</strong> (bûche en bois), prix TTC (TVA ${config.tva} incluse)</li>
            <li>Paiement sécurisé par carte bancaire avec Stripe</li>
            <li>Livraison au bureau&nbsp;: ${vagues.map((v) => v.livraison).join(' ou ')}</li>
            <li>Et pour les fêtes&nbsp;: champagne en direct du producteur, livré avec votre sapin</li>
          </ul>
        </div>

        <form class="sapins__code" data-sapins-code>
          <label for="sapins-code"><strong>Votre code entreprise</strong><span>Il a été communiqué par e-mail à votre responsable.</span></label>
          <div class="sapins__saisie">
            <input id="sapins-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" required>
            <button type="submit" class="bouton">Accéder aux sapins</button>
          </div>
          <p class="sapins__message" role="status" aria-live="polite"></p>
        </form>

        <div class="sapins__boutique" data-sapins-boutique hidden></div>

        <noscript><p class="centre">La commande nécessite JavaScript.</p></noscript>
      </div>
    </section>

    <section class="section section--creme">
      <article class="conteneur article">
        <h2>Comment ça marche&nbsp;?</h2>
        <ol>
          <li>Saisissez le <strong>code de votre entreprise</strong>.</li>
          <li>Choisissez votre <strong>date de livraison</strong> et votre <strong>taille de sapin</strong>.</li>
          <li>Payez par carte sur la page sécurisée de Stripe. Vous recevez aussitôt votre reçu par e-mail.</li>
          <li>Récupérez votre sapin au bureau le jour de la livraison&nbsp;: il porte une étiquette à vos prénom et nom.</li>
        </ol>
        <h2>Vous n'avez pas de code&nbsp;?</h2>
        <p>Le code de votre entreprise a été communiqué par e-mail à votre responsable&nbsp;: demandez-le-lui. La vente est réservée aux collaborateurs des entreprises partenaires de COPANIER. Vous souhaitez la proposer dans votre entreprise&nbsp;? <a class="js-devis" data-produit="Sapins de Noël" href="mailto:contact@copanier.fr?subject=Sapins%20de%20No%C3%ABl%20dans%20mon%20entreprise">Contactez-nous</a>.</p>

        <h2>Conditions de vente</h2>
        <p>Les <a href="/conditions-generales-de-vente/">conditions générales de vente</a> s'appliquent à toute commande. L'essentiel&nbsp;:</p>
        <details class="pliable" id="conditions">
          <summary>Sapins&nbsp;: commande, livraison, annulation <span class="pliable__plus">En savoir plus</span></summary>
          <ul>
          <li><strong>Vendeur</strong>&nbsp;: COMPTOIR DES FERMIERS (COPANIER), SASU au capital de 1&nbsp;000&nbsp;€, 3 route de Forfry, 77178 Oissery, RCS Meaux 904 666 724. Contact&nbsp;: <a href="mailto:contact@copanier.fr">contact@copanier.fr</a>.</li>
          <li><strong>Prix</strong>&nbsp;: indiqués en euros TTC, TVA à ${config.tva} incluse. Livraison au bureau incluse.</li>
          <li><strong>Paiement</strong>&nbsp;: par carte bancaire, à la commande, sur la page sécurisée de Stripe. COPANIER n'a jamais accès à vos données bancaires.</li>
          <li><strong>Commandes</strong>&nbsp;: jusqu'au ${dateLongue(premiere.fin)} pour une livraison le ${premiere.livraison}${vagues.length > 1 ? `, et jusqu'au ${dateLongue(derniere.fin)} pour une livraison le ${derniere.livraison}` : ''}. Passé ces dates, la livraison correspondante n'est plus proposée.</li>
          <li><strong>Livraison</strong>&nbsp;: à l'adresse de votre entreprise, à la date choisie. Elle est organisée à partir de ${config.seuil_par_entreprise}&nbsp;sapins commandés dans l'entreprise. En dessous, nous vous proposons un point de retrait proche ou le remboursement intégral.</li>
          <li><strong>Produit</strong>&nbsp;: sapin naturel coupé, livré avec son pied (bûche en bois) — ou sans pied, avec ${config.sans_pied ? config.sans_pied.remise : 2}&nbsp;€ de remise, en cochant la case correspondante — dont l'aspect peut varier légèrement d'un arbre à l'autre. Les tailles sont données à titre indicatif.</li>
          <li><strong>Annulation</strong>&nbsp;: le sapin étant un produit naturel coupé, susceptible de se détériorer rapidement, le droit de rétractation ne s'applique pas (article L221-28 du Code de la consommation). Vous pouvez toutefois annuler gratuitement par e-mail jusqu'à la date limite de commande de votre livraison&nbsp;: nous vous remboursons sur votre carte.</li>
          <li><strong>Réclamation</strong>&nbsp;: un sapin abîmé à la livraison est remplacé ou remboursé. Signalez-le-nous sous 48&nbsp;h à <a href="mailto:contact@copanier.fr">contact@copanier.fr</a>.</li>
          </ul>
        </details>
        <details class="pliable" id="alcool">
          <summary>Champagne et boissons alcoolisées <span class="pliable__plus">En savoir plus</span></summary>
          <ul>
            <li><strong>La vente d'alcool est interdite aux mineurs</strong> (article L3342-1 du Code de la santé publique). En commandant, vous certifiez avoir 18&nbsp;ans révolus. Une pièce d'identité peut vous être demandée à la remise de la commande.</li>
            <li>Les champagnes, vins, ratafias et spiritueux sont produits et mis en bouteille par la ${b.producteur || 'maison partenaire'}, vendus et livrés par COPANIER (COMPTOIR DES FERMIERS).</li>
            <li>Les boissons sont livrées en même temps que les sapins, dans votre entreprise, à la date choisie. Chaque commande est étiquetée à vos prénom et nom.</li>
            <li>Pour ces produits, vous disposez d'un droit de rétractation de 14&nbsp;jours à compter de la livraison&nbsp;: les bouteilles doivent être rendues intactes et non ouvertes (voir les <a href="/conditions-generales-de-vente/">conditions générales de vente</a>).</li>
          </ul>
        </details>
        <p class="mention-alcool">L'abus d'alcool est dangereux pour la santé, à consommer avec modération.</p>
        <p class="petit">Les données de commande (nom, e-mail, téléphone, service) servent uniquement à préparer et livrer votre commande. Voir notre <a href="/politique-de-confidentialite/">politique de confidentialité</a>.</p>
      </article>
    </section>
    <script type="application/json" id="sapins-donnees">${JSON.stringify({ iterations: ITERATIONS, sel: b64(SEL), coffre })}</script>
    <script src="/js/sapins.js" defer></script>`;

function dateLongue(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
}

ecrirePage({
  chemin: '/sapins-de-noel/', menu: '/sapins-de-noel/',
  titre: `Sapin de Noël livré au bureau ${config.annee} | CoPanier`,
  description: 'Commandez votre sapin Nordmann en ligne et récupérez-le au bureau : 5 tailles de 100 à 250 cm, paiement par carte, livraison dans votre entreprise.',
  ariane: [['Sapins de Noël']],
  h1: `Les <span class="accent">sapins de Noël</span> livrés au bureau`,
  chapo: 'Réservé aux collaborateurs des entreprises partenaires&nbsp;: saisissez votre code entreprise pour commander.',
  contenu,
});
ajouterAuPlan('/sapins-de-noel/');
console.log(`Page /sapins-de-noel/ générée : ${actives.length} entreprise(s)${codesCrees ? `, ${codesCrees} code(s) créé(s)` : ''}, ${sapins.filter((s) => s.lien).length}/${sapins.length} lien(s) de paiement.`);
console.log(`Codes à envoyer : outils/sapins/codes-a-envoyer.local.csv`);
