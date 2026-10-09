// @ts-nocheck
// =====================================================================
// Fonction Supabase « copanier-devis » — projet Supabase dédié à CoPanier
// Appelée par le site juste après l'enregistrement d'une demande de devis :
//   1. relit la demande dans la base (impossible de s'en servir pour envoyer des e-mails arbitraires) ;
//   2. crée un BROUILLON de devis dans Pennylane (jamais envoyé : vous le vérifiez et l'ajustez avant envoi) ;
//   3. envoie une fiche mise en page à contact@copanier.fr, avec le lien vers le brouillon ;
//   4. envoie un accusé de réception au client (seulement si l'expéditeur est sur le domaine copanier.fr).
//
// Réglages (Supabase → Edge Functions → Secrets) :
//   RESEND_API_KEY        obligatoire — clé du compte Resend de CoPanier
//   EXPEDITEUR            facultatif  — ex. « CoPanier de fruits au bureau <noreply@copanier.fr> » une fois
//                                       copanier.fr vérifié dans Resend (sinon adresse de test Resend)
//   PENNYLANE_API_TOKEN   facultatif  — jeton API Pennylane (droits : clients et devis en lecture/écriture, produits en lecture)
//                                       Les produits sont retrouvés par leur libellé (« Corbeilles de fruits (environ 7kg) »…).
// =====================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DESTINATAIRE = "contact@copanier.fr";
// Sans domaine vérifié, Resend n'autorise que son adresse de test, et seulement vers
// l'adresse du compte Resend : créez donc le compte Resend avec contact@copanier.fr.
const EXPEDITEUR = Deno.env.get("EXPEDITEUR") || "CoPanier de fruits au bureau <onboarding@resend.dev>";
const ACCUSE_CLIENT = /@copanier\.fr>?\s*$/.test(EXPEDITEUR);
const FRAICHEUR_MAX = 30 * 60 * 1000;   // on ne traite que les demandes de moins de 30 minutes
const SITE = "https://copanierdefruits.copanier.fr";
const PENNYLANE = "https://app.pennylane.com/api/external/v2";

// Tarifs des corbeilles types (identiques au site) — servent si aucun produit Pennylane n'est configuré
const FORMATS = [
  { kg: 7, prix: "34.85", max: 22, libelle: "Corbeille de fruits frais de saison — 7 kg (15 à 20 personnes)" },
  { kg: 10, prix: "48.33", max: 32, libelle: "Corbeille de fruits frais de saison — 10 kg (25 à 30 personnes)" },
  { kg: 13, prix: "61.00", max: 42, libelle: "Corbeille de fruits frais de saison — 13 kg (35 à 40 personnes)" },
];

const VERT = "#3f6653", NUIT = "#243d31", ORANGE = "#f4661c", ORANGE_FONCE = "#c94f0f", CREME = "#fbf8f2", LIGNE = "#dde6e0", GRIS = "#52695d";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
const emailValide = (e) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[a-z]{2,}$/i.test(String(e || "").trim());
const dateHeure = (iso) => new Date(iso || Date.now()).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Paris" });
const jour = (d) => new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });   // AAAA-MM-JJ
const personneDe = (r) => [r.prenom, r.nom].filter(Boolean).join(" ");

// Corbeilles conseillées selon le nombre de personnes (mêmes repères que le simulateur du site)
function corbeilles(n) {
  n = Number(n) || 0;
  if (!n) return { format: FORMATS[0], quantite: 1, aConfirmer: true };
  const f = FORMATS.find((x) => n <= x.max);
  if (f) return { format: f, quantite: 1, aConfirmer: false };
  return { format: FORMATS[2], quantite: Math.ceil(n / 40), aConfirmer: false };
}
function corbeilleTexte(n) {
  if (!Number(n)) return "";
  const c = corbeilles(n);
  return `${c.quantite > 1 ? c.quantite + " × " : ""}${c.format.kg} kg (${c.format.prix.replace(".", ",")} € HT l'unité en ponctuel)`;
}

/* ═════════════ Pennylane : client + brouillon de devis ═════════════ */

const pl = async (chemin, options = {}) => {
  const r = await fetch(PENNYLANE + chemin, {
    ...options,
    headers: { Authorization: "Bearer " + Deno.env.get("PENNYLANE_API_TOKEN"), "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) },
  });
  const texte = await r.text();
  let donnees = null;
  try { donnees = texte ? JSON.parse(texte) : null; } catch (_) { donnees = texte; }
  if (!r.ok) throw new Error(`Pennylane ${r.status} sur ${chemin} : ${typeof donnees === "string" ? donnees : JSON.stringify(donnees)}`.slice(0, 600));
  return donnees;
};

// Adresse libre → adresse structurée (Base Adresse Nationale, gratuite et sans clé)
async function adresseStructuree(texte) {
  texte = String(texte || "").trim();
  if (!texte) return null;
  try {
    const r = await fetch("https://api-adresse.data.gouv.fr/search/?limit=1&q=" + encodeURIComponent(texte));
    const f = (await r.json()).features?.[0];
    if (f && f.properties.score > 0.4) {
      return { address: f.properties.name, postal_code: f.properties.postcode, city: f.properties.city, country_alpha2: "FR" };
    }
  } catch (_) { /* on tente le découpage simple ci-dessous */ }
  const m = texte.match(/^(.*?)[,\s]+(\d{5})\s+(.+)$/);
  if (m) return { address: m[1].trim() || texte, postal_code: m[2], city: m[3].trim(), country_alpha2: "FR" };
  return null;
}

async function trouverClient(r) {
  const essais = [];
  if (emailValide(r.email)) essais.push([{ field: "emails", operator: "in", value: [String(r.email).trim()] }]);
  if (r.entreprise) essais.push([{ field: "name", operator: "eq", value: String(r.entreprise).trim() }]);
  for (const filtre of essais) {
    try {
      const rep = await pl("/customers?limit=5&filter=" + encodeURIComponent(JSON.stringify(filtre)));
      if (rep && rep.items && rep.items.length) return rep.items[0].id;
    } catch (e) { console.error("recherche client", e.message); }
  }
  return null;
}

async function creerClient(r) {
  const livraisons = Array.isArray(r.adresses_livraison) ? r.adresses_livraison : [];
  const facturation = await adresseStructuree(r.adresse_entreprise) || await adresseStructuree(livraisons[0]);
  if (!facturation) throw new Error("adresse de l'entreprise absente ou non reconnue : client à créer à la main dans Pennylane");
  const livraison = livraisons[0] && livraisons[0] !== r.adresse_entreprise ? await adresseStructuree(livraisons[0]) : null;
  const personne = personneDe(r);
  const commun = {
    billing_address: facturation,
    ...(livraison ? { delivery_address: livraison } : {}),
    emails: emailValide(r.email) ? [String(r.email).trim()] : [],
    ...(r.telephone ? { phone: String(r.telephone) } : {}),
    notes: `Créé automatiquement depuis le site CoPanier de fruits au bureau${r.role ? " — contact : " + personne + " (" + r.role + ")" : ""}`,
    billing_language: "fr_FR",
  };
  if (r.entreprise) {
    const c = await pl("/company_customers", { method: "POST", body: JSON.stringify({ name: String(r.entreprise).trim(), ...(personne ? { recipient: personne } : {}), ...commun }) });
    return c.id;
  }
  const c = await pl("/individual_customers", { method: "POST", body: JSON.stringify({ first_name: r.prenom || personne || "Client", last_name: r.nom || "", ...commun }) });
  return c.id;
}

// Produits déjà créés dans Pennylane (repérés par leur libellé, comme dans vos devis habituels)
const PRODUITS = {
  7: "Corbeilles de fruits (environ 7kg)",
  13: "Corbeilles de Fruits (environ 13 kg)",
  generique: "Corbeilles de fruits",
  frais: "Frais de livraison",
  offerte: "Livraison offerte",
};
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

async function produitsPennylane() {
  const rep = await pl("/products?limit=100");
  const parLibelle = {};
  for (const p of rep?.items || []) parLibelle[norm(p.label)] = p.id;
  const id = (cle) => parLibelle[norm(PRODUITS[cle])];
  const manquants = Object.keys(PRODUITS).filter((k) => !id(k));
  if (manquants.length) throw new Error("produits introuvables dans Pennylane : " + manquants.map((k) => "« " + PRODUITS[k] + " »").join(", "));
  return id;
}

// Conditions reprises de vos devis (description de la ligne « corbeilles »)
const CONDITIONS = {
  hebdo: [
    "Prix correspondant à une semaine de livraison",
    "Livraison des corbeilles chaque semaine",
    "Nous tenons compte des dates durant lesquelles l'entreprise ne souhaite pas être livrée (exemple : période des fêtes de fin d'année)",
    "Composition des paniers qui évolue en fonction des productions de saison",
    "Règlement par virement mensualisé",
    "La perte d'une corbeille est facturée 20€ HT",
    "Prix révisable annuellement pour tenir compte de l'inflation",
    "Pour toutes modifications de livraisons veuillez nous informer par mail au moins deux semaines à l'avance",
  ],
  bimensuel: [
    "Prix correspondant à une livraison",
    "Livraison des corbeilles tous les 15 jours",
    "Nous tenons compte des dates durant lesquelles l'entreprise ne souhaite pas être livrée (exemple : période des fêtes de fin d'année)",
    "Composition des paniers qui évolue en fonction des productions de saison",
    "Règlement par virement mensualisé",
    "La perte d'une corbeille est facturée 20€ HT",
    "Prix révisable annuellement pour tenir compte de l'inflation",
    "Pour toutes modifications de livraisons veuillez nous informer par mail au moins deux semaines à l'avance",
  ],
  autre: [
    "Prix correspondant à une livraison",
    "Livraison des corbeilles selon la fréquence convenue ensemble",
    "Nous tenons compte des dates durant lesquelles l'entreprise ne souhaite pas être livrée (exemple : période des fêtes de fin d'année)",
    "Composition des paniers qui évolue en fonction des productions de saison",
    "Règlement par virement mensualisé",
    "La perte d'une corbeille est facturée 20€ HT",
    "Prix révisable annuellement pour tenir compte de l'inflation",
    "Pour toutes modifications de livraisons veuillez nous informer par mail au moins deux semaines à l'avance",
  ],
};
const puces = (l) => l.map((x) => "- " + x).join("\n");

function typeFormule(f) {
  f = norm(f);
  if (f.includes("ponctuelle")) return "ponctuel";
  if (f.includes("2 semaines")) return "bimensuel";
  if (f.includes("autre")) return "autre";
  return "hebdo"; // « chaque semaine » ou « je ne sais pas encore » : offre habituelle
}

async function creerBrouillonDevis(r, clientId) {
  const produit = await produitsPennylane();
  const c = corbeilles(r.personnes);
  const type = typeFormule(r.formule);
  const livraisons = (Array.isArray(r.adresses_livraison) ? r.adresses_livraison : []).filter(Boolean);
  const site = livraisons[0] ? await adresseStructuree(livraisons[0]) : null;
  const nom = [String(r.entreprise || personneDe(r) || "Client").trim(), site?.city?.replace(/ Arrondissement$/, "")].filter(Boolean).join(" ");

  // Ligne « corbeilles » : 7 kg et 13 kg = vos produits ; 10 kg = produit générique au prix du site
  const kg = c.format.kg;
  const ligneCorbeille = kg === 10
    ? { product_id: produit("generique"), label: "Corbeilles de fruits (environ 10 kg)", raw_currency_unit_price: c.format.prix, quantity: c.quantite }
    : { product_id: produit(kg), quantity: c.quantite };
  const taille = `${c.quantite} corbeille${c.quantite > 1 ? "s" : ""} d'environ ${kg} kg`;
  const lignes = [];
  let sujet;

  if (type === "ponctuel") {
    sujet = `Corbeilles de fruits frais- Livraison ponctuelle -${nom}`;
    lignes.push({ ...ligneCorbeille, description: taille });
    lignes.push({
      product_id: produit("frais"),
      quantity: 1,
      description: [
        "Livraison prévue le : date à convenir",
        ...(livraisons.length ? ["Adresse : " + livraisons.join(" ; ")] : []),
        "",
        puces(["Règlement par virement", "La perte d'une corbeille est facturée 20€ HT"]),
      ].join("\n"),
    });
  } else {
    sujet = {
      hebdo: `Livraison hebdomadaire de Corbeilles de fruits-${nom}`,
      bimensuel: `Livraisons de Corbeilles de fruits bimensuelle-${nom}`,
      autre: `Livraison de Corbeilles de fruits-${nom}`,
    }[type];
    lignes.push({ ...ligneCorbeille, description: (c.quantite > 1 ? taille + "\n" : "") + puces(CONDITIONS[type]) });
    lignes.push({ product_id: produit("offerte"), quantity: 1, description: livraisons.length ? livraisons.join("\n") : null });
  }

  const aujourdhui = new Date();
  return await pl("/quotes", {
    method: "POST",
    body: JSON.stringify({
      customer_id: clientId,
      date: jour(aujourdhui),
      deadline: jour(aujourdhui.getTime() + 30 * 24 * 3600 * 1000),
      language: "fr_FR",
      pdf_invoice_subject: sujet,
      external_reference: "copanier-site-" + String(r.id).slice(0, 8),
      invoice_lines: lignes,
    }),
  });
}

// Contact du client (utilisé par Pennylane dans la fenêtre d'envoi des devis)
async function ajouterContact(r, clientId) {
  const email = String(r.email || "").trim();
  if (!emailValide(email)) return;
  try {
    const existants = await pl(`/customers/${clientId}/contacts?limit=100`);
    if ((existants?.items || []).some((c) => norm(c.email) === norm(email))) return;
  } catch (e) { console.error("liste contacts", e.message); }
  const tel = String(r.telephone || "").replace(/[\s.-]/g, "");
  const mobile = /^(\+33|0033|0)[67]\d{8}$/.test(tel);
  const nomDeFamille = String(r.nom || "").trim();
  const prenom = String(r.prenom || "").trim();
  await pl(`/customers/${clientId}/contacts`, {
    method: "POST",
    body: JSON.stringify({
      first_name: prenom || "Contact",
      last_name: nomDeFamille || String(r.entreprise || "").trim() || email.split("@")[0],
      email,
      ...(r.role ? { role: String(r.role).trim() } : {}),
      ...(tel ? (mobile ? { mobile_number: String(r.telephone).trim() } : { telephone_number: String(r.telephone).trim() }) : {}),
    }),
  });
}

async function pennylane(r) {
  if (!Deno.env.get("PENNYLANE_API_TOKEN")) return { statut: "non configuré" };
  try {
    const clientId = (await trouverClient(r)) || (await creerClient(r));
    try { await ajouterContact(r, clientId); } catch (e) { console.error("contact Pennylane", e.message); }
    const devis = await creerBrouillonDevis(r, clientId);
    return { statut: "ok", clientId, devisId: devis.id, numero: devis.quote_number || devis.label || "" };
  } catch (e) {
    console.error("Pennylane", e.message);
    return { statut: "erreur", erreur: e.message };
  }
}

/* ═════════════ E-mails (tableaux + styles en ligne : compatibles avec toutes les messageries) ═════════════ */

const cadre = (contenu, largeur = 640) => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#eef3ef;font-family:Arial,Helvetica,sans-serif;color:${NUIT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3ef"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:${largeur}px;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:${VERT};padding:18px 24px"><span style="font-family:'Courier New',monospace;font-size:24px;font-weight:bold;letter-spacing:2px;color:${ORANGE}">CO</span><span style="font-family:'Courier New',monospace;font-size:24px;font-weight:bold;letter-spacing:2px;color:#ffffff">PANIER</span><br><span style="font-size:11px;letter-spacing:2px;color:#ffd2b8">FRUITS DE SAISON AU BUREAU · S'ASSOCIER POUR MIEUX MANGER</span></td></tr>
${contenu}
<tr><td style="background:${CREME};padding:14px 24px;font-size:11px;color:${GRIS}">CoPanier de fruits au bureau · <a href="${SITE}" style="color:${GRIS}">copanierdefruits.copanier.fr</a> · <a href="mailto:${DESTINATAIRE}" style="color:${GRIS}">${DESTINATAIRE}</a></td></tr>
</table></td></tr></table></body></html>`;
const bloc = (titre, html) => `<tr><td style="padding:18px 24px 4px"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${ORANGE_FONCE};font-weight:bold;border-bottom:1px solid ${LIGNE};padding-bottom:6px;margin-bottom:10px">${titre}</div>${html}</td></tr>`;
const ligne = (lib, val) => (val ? `<tr><td width="170" style="width:170px;padding:5px 14px 5px 0;color:${GRIS};font-size:13px;vertical-align:top">${lib}</td><td style="padding:5px 0;font-size:14px;vertical-align:top">${val}</td></tr>` : "");
const tableau = (lignes) => `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${lignes.join("")}</table>`;
const bouton = (href, txt, fond = ORANGE) => `<a href="${href}" style="display:inline-block;background:${fond};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:999px;margin:0 6px 8px 0">${txt}</a>`;

function blocPennylane(p) {
  if (p.statut === "ok") {
    return `<tr><td style="padding:14px 24px 0"><div style="background:#e8f0eb;border:2px solid ${VERT};border-radius:10px;padding:12px 16px;font-size:14px;line-height:1.5">
<b>🧾 Brouillon de devis créé dans Pennylane${p.numero ? " — n° " + esc(p.numero) : ""}</b><br>Il n'a <b>pas</b> été envoyé au client : vérifiez-le, ajustez prix et quantités si besoin, puis envoyez-le depuis Pennylane.<br>
<a href="https://app.pennylane.com/companies/23266840/clients/customer_estimates" style="color:${VERT};font-weight:bold">Ouvrir les devis dans Pennylane</a></div></td></tr>`;
  }
  if (p.statut === "erreur") {
    return `<tr><td style="padding:14px 24px 0"><div style="background:#fdecea;border:2px solid #d93025;border-radius:10px;padding:12px 16px;font-size:13px;line-height:1.5">
<b>⚠️ Le brouillon Pennylane n'a pas pu être créé.</b> Créez le devis à la main.<br><span style="color:${GRIS}">${esc(p.erreur)}</span></div></td></tr>`;
  }
  return "";
}

function ficheInterne(r, p) {
  const adresses = Array.isArray(r.adresses_livraison) ? r.adresses_livraison : [];
  const personne = personneDe(r);
  const qui = r.entreprise || personne || r.email || "Nouveau contact";
  const sujet = `${r.rappel ? "📞 À rappeler — " : ""}Demande de devis — ${qui}${r.personnes ? " · " + r.personnes + " pers." : ""}`;
  const tel = r.telephone ? `<a href="tel:${esc(String(r.telephone).replace(/[^\d+]/g, ""))}" style="color:${NUIT};font-weight:bold">${esc(r.telephone)}</a>` : "";
  const listeAdresses = adresses.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${adresses.map((a, i) => `<tr><td style="width:26px;padding:6px 8px 6px 0;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${CREME};color:${VERT};font-size:12px;font-weight:bold">${i + 1}</span></td><td style="padding:6px 0;font-size:14px;border-bottom:1px solid ${LIGNE}">${esc(a)} — <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}" style="color:${ORANGE_FONCE};font-size:12px">carte</a></td></tr>`).join("")}</table>`
    : `<p style="font-size:14px;margin:0;color:${GRIS}">Non précisée.</p>`;
  const reponse = r.email
    ? `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent("Votre devis CoPanier de fruits au bureau")}&body=${encodeURIComponent(`Bonjour${personne ? " " + personne : ""},\n\nMerci pour votre demande de devis.\n\n`)}`
    : "";
  const contenu = `
<tr><td style="padding:22px 24px 6px"><div style="font-size:12px;color:${GRIS}">${esc(dateHeure(r.created_at))}</div>
<div style="font-family:Georgia,serif;font-size:24px;margin-top:4px">Nouvelle demande de devis</div></td></tr>
${r.rappel ? `<tr><td style="padding:12px 24px 0"><div style="background:#fff1e8;border:2px solid ${ORANGE};border-radius:10px;padding:12px 16px;font-size:15px"><b>📞 Le client souhaite être rappelé</b>${r.creneau ? " — " + esc(String(r.creneau).toLowerCase()) : ""}<br><span style="font-size:18px">${tel || "numéro non indiqué"}</span></div></td></tr>` : ""}
${blocPennylane(p)}
<tr><td style="padding:14px 24px 0">${reponse ? bouton(reponse, "✉️ Répondre au client") : ""}${r.telephone ? bouton(`tel:${esc(String(r.telephone).replace(/[^\d+]/g, ""))}`, "📞 Appeler", VERT) : ""}</td></tr>
${bloc("Contact", tableau([
    ligne("Entreprise", r.entreprise ? `<b>${esc(r.entreprise)}</b>` : ""),
    ligne("Contact", personne ? `<b>${esc(personne)}</b>` : ""),
    ligne("Rôle", esc(r.role)),
    ligne("E-mail", r.email ? `<a href="mailto:${esc(r.email)}" style="color:${NUIT}">${esc(r.email)}</a>` : ""),
    ligne("Téléphone", tel),
  ]))}
${bloc("Besoin", tableau([
    ligne("Formule", esc(r.formule)),
    ligne("Nombre de personnes", r.personnes ? `<b>${esc(r.personnes)}</b>` : ""),
    ligne("Corbeille conseillée", esc(corbeilleTexte(r.personnes))),
  ]))}
${bloc("Adresse de l'entreprise", `<p style="font-size:14px;margin:0">${r.adresse_entreprise ? esc(r.adresse_entreprise) : `<span style="color:${GRIS}">Non précisée.</span>`}</p>`)}
${bloc(adresses.length > 1 ? `Adresses de livraison (${adresses.length})` : "Adresse de livraison", listeAdresses)}
${r.message ? bloc("Message", `<div style="font-size:14px;line-height:1.6;background:${CREME};border-left:3px solid ${ORANGE};padding:10px 12px">${nl2br(r.message)}</div>`) : ""}
<tr><td style="padding:14px 24px 18px;font-size:11px;color:${GRIS}">Envoyée depuis la page ${esc(r.page || "/")} du site · référence ${esc(String(r.id).slice(0, 8))}</td></tr>`;
  return { subject: sujet, html: cadre(contenu) };
}

function accuse(r) {
  const salut = r.prenom || r.nom ? " " + esc(personneDe(r)) : "";
  const contenu = `
<tr><td style="padding:26px 28px 8px;font-size:15px;line-height:1.7">
<p style="margin:0 0 14px">Bonjour${salut},</p>
<p style="margin:0 0 14px">Merci pour votre demande de devis : nous l'avons bien reçue.</p>
<p style="margin:0 0 14px">${r.rappel ? "Comme vous l'avez demandé, nous vous rappelons très vite" + (r.creneau ? " (" + esc(String(r.creneau).toLowerCase()) + ")" : "") + "." : "Nous revenons vers vous très rapidement avec une proposition adaptée à votre équipe."}</p>
<p style="margin:0 0 14px">Chaque semaine, nous allons chercher nos fruits chez nos producteurs pour vous garantir des corbeilles d'une fraîcheur optimale.</p>
<p style="margin:0">À très bientôt,<br><b>L'équipe CoPanier de fruits au bureau</b><br><a href="mailto:${DESTINATAIRE}" style="color:${ORANGE_FONCE}">${DESTINATAIRE}</a></p>
</td></tr><tr><td style="padding:10px"></td></tr>`;
  return { subject: "Nous avons bien reçu votre demande — CoPanier de fruits au bureau", html: cadre(contenu, 600) };
}

/* ═════════════ Base de données et Resend ═════════════ */

const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_CLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = (chemin, options = {}) => fetch(`${SB_URL}/rest/v1/${chemin}`, {
  ...options, headers: { apikey: SB_CLE, Authorization: `Bearer ${SB_CLE}`, "Content-Type": "application/json", ...(options.headers || {}) },
});
async function relire(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) return null;
  const r = await sb(`devis_copanier?id=eq.${id}&select=*`);
  if (!r.ok) return null;
  return (await r.json())[0] || null;
}
// Verrou : ne passe à « notifie = true » que si la demande ne l'était pas déjà (une seule exécution par demande)
async function verrouiller(id) {
  const r = await sb(`devis_copanier?id=eq.${id}&notifie=is.false`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ notifie: true }) });
  return r.ok && (await r.json()).length === 1;
}
async function marquer(id, champs) {
  await sb(`devis_copanier?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(champs) });
}
async function envoyerMail({ to, subject, html, reply_to }) {
  const cle = Deno.env.get("RESEND_API_KEY");
  if (!cle) { console.error("Secret RESEND_API_KEY manquant"); return false; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EXPEDITEUR, to, subject, html, reply_to }),
  });
  if (!r.ok) console.error("Resend", r.status, await r.text());
  return r.ok;
}

async function traiter(id) {
  const rec = await relire(id);
  if (!rec) return "introuvable";
  if (rec.notifie) return "déjà traitée";
  if (Date.now() - new Date(rec.created_at).getTime() > FRAICHEUR_MAX) return "trop ancienne";
  if (!(await verrouiller(rec.id))) return "déjà en cours";

  const p = await pennylane(rec);
  await marquer(rec.id, {
    pennylane_client_id: p.clientId ?? null,
    pennylane_devis_id: p.devisId ?? null,
    pennylane_devis_numero: p.numero || null,
    pennylane_erreur: p.statut === "erreur" ? p.erreur : (p.statut === "non configuré" ? "Pennylane non configuré" : null),
  });

  const fiche = ficheInterne(rec, p);
  const client = emailValide(rec.email) ? String(rec.email).trim() : undefined;
  const ok = await envoyerMail({ to: DESTINATAIRE, subject: fiche.subject, html: fiche.html, reply_to: client });
  if (!ok) { await marquer(rec.id, { notifie: false }); return "échec envoi"; }
  if (ACCUSE_CLIENT && client) {
    const acc = accuse(rec);
    if (await envoyerMail({ to: client, subject: acc.subject, html: acc.html, reply_to: DESTINATAIRE })) await marquer(rec.id, { accuse_envoye: true });
  }
  return "envoyée";
}

/* ═════════════ Devis signés (vérification toutes les 15 min par une tâche planifiée) ═════════════ */

const LIEN_DEVIS = "https://app.pennylane.com/companies/23266840/clients/customer_estimates";
const euros = (v) => (v == null || v === "" ? "" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }));

async function clientPennylane(id) {
  try { return await pl(`/customers/${id}`); } catch (_) { return null; }
}

function mailSigne(d) {
  return cadre(`<tr><td style="padding:22px 24px 6px"><div style="background:#e8f0eb;border:2px solid ${VERT};border-radius:10px;padding:14px 18px;font-size:16px;line-height:1.5">
<b>✅ Devis signé par ${esc(d.client)}</b><br>Devis n° <b>${esc(d.numero)}</b> — ${esc(d.montant_ht)} HT</div></td></tr>
${bloc("Et maintenant ?", `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Le client a signé son devis. Pensez à planifier la première livraison et à préparer la facturation.</p>${bouton(LIEN_DEVIS, "Voir le devis dans Pennylane", VERT)}`)}`);
}

function mailRemerciement(d) {
  return cadre(`<tr><td style="padding:22px 24px">
<p style="font-size:15px;line-height:1.6;margin:0 0 12px">Bonjour,</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px">Merci pour votre confiance ! Nous avons bien reçu votre devis <b>n° ${esc(d.numero)}</b> signé.</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px">Vous le trouverez en pièce jointe. Nous revenons vers vous très vite pour organiser la première livraison de vos corbeilles de fruits frais.</p>
<p style="font-size:15px;line-height:1.6;margin:0">À très bientôt,<br><b>L'équipe CoPanier de fruits au bureau</b></p></td></tr>`);
}

async function verifierSignatures() {
  if (!Deno.env.get("PENNYLANE_API_TOKEN")) return "Pennylane non configuré";
  const filtre = encodeURIComponent(JSON.stringify([{ field: "status", operator: "in", value: ["accepted", "invoiced"] }]));
  const devis = (await pl(`/quotes?limit=100&filter=${filtre}`))?.items || [];
  const deja = await (await sb("pennylane_suivi?select=devis_id")).json();
  const connus = new Set((deja || []).map((x) => String(x.devis_id)));

  // Première exécution : les devis déjà signés auparavant sont simplement mémorisés, sans alerte
  if (!connus.size) {
    if (devis.length) {
      await sb("pennylane_suivi", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify(devis.map((q) => ({ devis_id: q.id, numero: q.quote_number || q.label, statut: q.status, alerte_envoyee: true, client_remercie: true }))) });
    }
    return `initialisation : ${devis.length} devis déjà signés mémorisés`;
  }

  let n = 0;
  for (const q of devis.filter((q) => !connus.has(String(q.id)))) {
    const c = q.customer?.id ? await clientPennylane(q.customer.id) : null;
    const d = { devis_id: q.id, numero: q.quote_number || q.label || String(q.id), client: c?.name || [c?.first_name, c?.last_name].filter(Boolean).join(" ") || "Client", montant_ht: euros(q.currency_amount_before_tax), statut: q.status };
    // on réserve la ligne d'abord : une seule alerte même si deux vérifications se croisent
    const r = await sb("pennylane_suivi", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify(d) });
    if (!r.ok || !(await r.json()).length) continue;
    const ok = await envoyerMail({ to: [DESTINATAIRE], subject: `✅ Devis signé — ${d.client} — ${d.numero} (${d.montant_ht} HT)`, html: mailSigne(d) });
    await sb(`pennylane_suivi?devis_id=eq.${q.id}`, { method: "PATCH", body: JSON.stringify({ alerte_envoyee: ok }) });
    n++;

    // Remerciement au client avec le devis signé en pièce jointe (seulement avec un expéditeur @copanier.fr vérifié)
    const emails = (c?.emails || []).filter(emailValide);
    if (ACCUSE_CLIENT && emails.length) {
      try {
        const frais = await pl(`/quotes/${q.id}`);
        const pieces = [];
        if (frais?.public_file_url) {
          const pdf = new Uint8Array(await (await fetch(frais.public_file_url)).arrayBuffer());
          let bin = ""; for (let i = 0; i < pdf.length; i += 0x8000) bin += String.fromCharCode(...pdf.subarray(i, i + 0x8000));
          pieces.push({ filename: `Devis-signe-${d.numero}.pdf`, content: btoa(bin) });
        }
        const env = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"), "Content-Type": "application/json" },
          body: JSON.stringify({ from: EXPEDITEUR, to: emails, reply_to: DESTINATAIRE, subject: `Merci ! Votre devis ${d.numero} est bien signé — CoPanier`, html: mailRemerciement(d), attachments: pieces }),
        });
        if (env.ok) await sb(`pennylane_suivi?devis_id=eq.${q.id}`, { method: "PATCH", body: JSON.stringify({ client_remercie: true }) });
        else console.error("remerciement", env.status, await env.text());
      } catch (e) { console.error("remerciement", e.message); }
    }
  }
  return `${n} nouveau(x) devis signé(s)`;
}

/* ═════════════ Rapport du vendredi 10 h 30 ═════════════ */

const STATUTS = { pending: "En attente", accepted: "✅ Signé", denied: "❌ Refusé", invoiced: "✅ Facturé", expired: "⌛ Expiré" };

function heureParis() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { jour: p.weekday, heure: Number(p.hour) };
}

function statsVisites(lignes) {
  const pages = lignes.length;
  const entrees = lignes.filter((v) => v.source !== "interne");
  const parSource = {}; for (const v of entrees) parSource[v.source] = (parSource[v.source] || 0) + 1;
  const parPage = {}; for (const v of lignes) parPage[v.chemin] = (parPage[v.chemin] || 0) + 1;
  const tri = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
  return { pages, visites: entrees.length, sources: tri(parSource), top: tri(parPage).slice(0, 8) };
}
const evolution = (a, b) => (!b ? (a ? "nouveau" : "—") : `${a >= b ? "▲" : "▼"} ${Math.round(Math.abs(a - b) / b * 100)} %`);

async function rapportHebdo(force) {
  const { jour: jourSemaine, heure } = heureParis();
  if (force) {
    // essai manuel possible uniquement avant le tout premier rapport réel
    const deja = await (await sb("rapports_hebdo?select=semaine&limit=1")).json();
    if ((deja || []).length) return "essai refusé : les rapports sont déjà en service";
  } else if (!(jourSemaine.startsWith("ven") && heure === 10)) return "pas l'heure du rapport";
  const lundi = new Date(); lundi.setUTCDate(lundi.getUTCDate() - ((lundi.getUTCDay() + 6) % 7));
  const semaine = jour(lundi);
  if (!force) {
    const r = await sb("rapports_hebdo", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({ semaine }) });
    if (!r.ok || !(await r.json()).length) return "rapport déjà envoyé cette semaine";
  }
  const maintenant = Date.now(), J7 = 7 * 24 * 3600 * 1000;
  const depuis = new Date(maintenant - J7).toISOString(), avant = new Date(maintenant - 2 * J7).toISOString();

  // Demandes de devis des 7 derniers jours (hors essais)
  const demandes = (await (await sb(`devis_copanier?created_at=gte.${depuis}&order=created_at.asc&select=created_at,entreprise,prenom,nom,personnes,formule,rappel,pennylane_devis_id,pennylane_devis_numero,pennylane_erreur`)).json() || [])
    .filter((d) => !/^TEST CoPanier/i.test(d.entreprise || ""));
  for (const d of demandes) {
    d.etat = d.pennylane_devis_id ? "En attente" : "⚠️ Pas de brouillon";
    if (d.pennylane_devis_id && Deno.env.get("PENNYLANE_API_TOKEN")) {
      try { const q = await pl(`/quotes/${d.pennylane_devis_id}`); d.etat = STATUTS[q.status] || q.status; } catch (_) { /* devis supprimé ? */ d.etat = "Devis introuvable"; }
    }
  }
  const aTraiter = demandes.filter((d) => /attente|Pas de brouillon|introuvable/i.test(d.etat)).length;
  const signes = await (await sb(`pennylane_suivi?signe_le=gte.${depuis}&alerte_envoyee=eq.true&order=signe_le.asc&select=numero,client,montant_ht`)).json() || [];

  // Fréquentation (mesure anonyme du site)
  const v1 = statsVisites(await (await sb(`visites?created_at=gte.${depuis}&select=chemin,source&limit=100000`)).json() || []);
  const v0 = statsVisites(await (await sb(`visites?created_at=gte.${avant}&created_at=lt.${depuis}&select=chemin,source&limit=100000`)).json() || []);

  const cellule = (t, style = "") => `<td style="padding:7px 8px;border-bottom:1px solid ${LIGNE};font-size:13px;vertical-align:top;${style}">${t}</td>`;
  const entete = (cols) => `<tr>${cols.map((c) => `<th align="left" style="padding:7px 8px;border-bottom:2px solid ${VERT};font-size:12px;color:${GRIS};text-transform:uppercase;letter-spacing:1px">${c}</th>`).join("")}</tr>`;
  const table = (cols, lignes) => `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${entete(cols)}${lignes.join("")}</table>`;
  const dateCourte = (iso) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });

  const blocDemandes = demandes.length
    ? table(["Reçue", "Entreprise", "Pers.", "Formule", "Devis", "État"], demandes.map((d) => `<tr>${cellule(dateCourte(d.created_at))}${cellule(esc(d.entreprise || [d.prenom, d.nom].filter(Boolean).join(" ") || "—") + (d.rappel ? " 📞" : ""))}${cellule(esc(d.personnes || "—"))}${cellule(esc(d.formule || "—"))}${cellule(esc(d.pennylane_devis_numero || "—"))}${cellule(esc(d.etat), /attente|Pas de|introuvable/i.test(d.etat) ? `color:${ORANGE_FONCE};font-weight:bold` : `color:${VERT};font-weight:bold`)}</tr>`))
    : `<p style="font-size:14px;margin:0">Aucune demande de devis cette semaine.</p>`;
  const blocSignes = signes.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7">${signes.map((s) => `<li><b>${esc(s.client)}</b> — ${esc(s.numero)} — ${esc(s.montant_ht)} HT</li>`).join("")}</ul>`
    : `<p style="font-size:14px;margin:0">Aucun devis signé cette semaine.</p>`;
  const blocVisites = `${tableau([
    ligne("Visites (arrivées sur le site)", `<b>${v1.visites}</b> &nbsp; <span style="color:${GRIS}">${evolution(v1.visites, v0.visites)} vs semaine précédente (${v0.visites})</span>`),
    ligne("Pages vues", `<b>${v1.pages}</b> &nbsp; <span style="color:${GRIS}">${evolution(v1.pages, v0.pages)} (${v0.pages})</span>`),
    ligne("D'où viennent les visiteurs", v1.sources.length ? v1.sources.map(([s, n]) => `${esc(s)} : <b>${n}</b>`).join(" · ") : "—"),
    ligne("Pages les plus vues", v1.top.length ? v1.top.map(([p, n]) => `${esc(p)} (${n})`).join("<br>") : "—"),
  ])}<p style="font-size:12px;color:${GRIS};margin:10px 0 0">Mesure anonyme, sans cookie. Positions et recherches Google : <a href="https://search.google.com/search-console/performance/search-analytics?resource_id=https%3A%2F%2Fcopanierdefruits.copanier.fr%2F" style="color:${VERT}">Search Console</a>.</p>`;

  const resume = `<tr><td style="padding:20px 24px 4px"><div style="font-size:18px;font-weight:bold;color:${NUIT}">Rapport de la semaine</div>
<div style="font-size:14px;color:${GRIS};margin-top:4px">${demandes.length} demande${demandes.length > 1 ? "s" : ""} de devis · ${signes.length} devis signé${signes.length > 1 ? "s" : ""} · ${v1.visites} visites</div>
${aTraiter ? `<div style="margin-top:12px;background:#fff1e8;border-left:4px solid ${ORANGE};padding:10px 14px;font-size:14px"><b>${aTraiter} demande${aTraiter > 1 ? "s" : ""} encore en attente</b> : devis à envoyer ou à relancer.</div>` : ""}</td></tr>`;
  const html = cadre(resume + bloc("Demandes de devis (7 derniers jours)", blocDemandes + `<p style="margin:12px 0 0">${bouton(LIEN_DEVIS, "Ouvrir les devis dans Pennylane", VERT)}</p>`) + bloc("Devis signés", blocSignes) + bloc("Fréquentation du site", blocVisites), 720);
  const ok = await envoyerMail({ to: [DESTINATAIRE], subject: `📊 Rapport CoPanier — ${demandes.length} demande(s), ${signes.length} signé(s), ${v1.visites} visites`, html });
  return ok ? "rapport envoyé" : "échec de l'envoi du rapport";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let corps;
  try { corps = await req.json(); } catch (_) { return new Response("requête invalide", { status: 400, headers: CORS }); }
  // Tâches planifiées (pg_cron) : sans effet si on les appelle hors de leur créneau ou deux fois
  if (corps.action === "signatures" || corps.action === "rapport") {
    try {
      const resultat = corps.action === "signatures" ? await verifierSignatures() : await rapportHebdo(corps.essai === true);
      return new Response(JSON.stringify({ resultat }), { headers: { ...CORS, "Content-Type": "application/json" } });
    } catch (e) {
      console.error(corps.action, e);
      return new Response(JSON.stringify({ resultat: "erreur" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }
  }
  // Appel du site ({ id }) ou d'un webhook de base de données ({ record: { id } })
  const id = corps.id || (corps.record && corps.record.id);
  try {
    const resultat = await traiter(id);
    return new Response(JSON.stringify({ resultat }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("copanier-devis", e);
    return new Response(JSON.stringify({ resultat: "erreur" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
