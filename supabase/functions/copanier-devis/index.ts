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
//   PENNYLANE_API_TOKEN   facultatif  — jeton API Pennylane (droits : clients + devis + produits en lecture)
//   PENNYLANE_PRODUITS    facultatif  — identifiants des produits Pennylane, ex. {"7":111,"10":222,"13":333}
//   PENNYLANE_COMPTE_VENTE_ID  facultatif — à défaut de produits : identifiant du compte de vente (706…)
//   PENNYLANE_MODELE_DEVIS_ID  facultatif — modèle de devis Pennylane à utiliser
// =====================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DESTINATAIRE = "contact@copanier.fr";
// Sans domaine vérifié, Resend n'autorise que son adresse de test, et seulement vers
// l'adresse du compte Resend : créez donc le compte Resend avec contact@copanier.fr.
const EXPEDITEUR = Deno.env.get("EXPEDITEUR") || "CoPanier de fruits au bureau <onboarding@resend.dev>";
const ACCUSE_CLIENT = /@copanier\.fr>?\s*$/.test(EXPEDITEUR);
const FRAICHEUR_MAX = 30 * 60 * 1000;   // on ne traite que les demandes de moins de 30 minutes
const SITE = "https://www.copanier.fr";
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
    notes: `Créé automatiquement depuis le site www.copanier.fr${r.role ? " — contact : " + personne + " (" + r.role + ")" : ""}`,
    billing_language: "fr_FR",
  };
  if (r.entreprise) {
    const c = await pl("/company_customers", { method: "POST", body: JSON.stringify({ name: String(r.entreprise).trim(), ...(personne ? { recipient: personne } : {}), ...commun }) });
    return c.id;
  }
  const c = await pl("/individual_customers", { method: "POST", body: JSON.stringify({ first_name: r.prenom || personne || "Client", last_name: r.nom || "", ...commun }) });
  return c.id;
}

async function creerBrouillonDevis(r, clientId) {
  const c = corbeilles(r.personnes);
  const livraisons = Array.isArray(r.adresses_livraison) ? r.adresses_livraison : [];
  const description = [
    `Formule demandée : ${r.formule || "à préciser"}`,
    r.personnes ? `Pour ${r.personnes} personnes` : "Nombre de personnes à confirmer",
    livraisons.length ? `Livraison : ${livraisons.join(" ; ")}` : "",
  ].filter(Boolean).join("\n");

  let produits = {};
  try { produits = JSON.parse(Deno.env.get("PENNYLANE_PRODUITS") || "{}"); } catch (_) { produits = {}; }
  const produitId = produits[String(c.format.kg)];
  let ligne;
  if (produitId) {
    ligne = { product_id: Number(produitId), quantity: c.quantite, description };
  } else {
    const compte = Deno.env.get("PENNYLANE_COMPTE_VENTE_ID");
    if (!compte) throw new Error("aucun produit Pennylane (PENNYLANE_PRODUITS) ni compte de vente (PENNYLANE_COMPTE_VENTE_ID) configuré");
    ligne = { label: c.format.libelle, quantity: c.quantite, raw_currency_unit_price: c.format.prix, unit: "piece", vat_rate: "FR_55", ledger_account_id: Number(compte), description };
  }
  const aujourdhui = new Date();
  const corps = {
    customer_id: clientId,
    date: jour(aujourdhui),
    deadline: jour(aujourdhui.getTime() + 30 * 24 * 3600 * 1000),
    language: "fr_FR",
    pdf_invoice_subject: "Corbeilles de fruits frais de saison au bureau",
    pdf_description: `Livraison de corbeilles de fruits frais de saison dans vos locaux.${r.formule && /semaine|récurrence/i.test(r.formule) ? " Tarif dégressif selon la fréquence et les volumes." : ""}`,
    pdf_invoice_free_text: "Chaque semaine, nous allons chercher nos fruits chez nos producteurs pour une fraîcheur optimale. Sans engagement de durée.",
    external_reference: "copanier-site-" + String(r.id).slice(0, 8),
    invoice_lines: [ligne],
  };
  const modele = Deno.env.get("PENNYLANE_MODELE_DEVIS_ID");
  if (modele) corps.quote_template_id = Number(modele);
  return await pl("/quotes", { method: "POST", body: JSON.stringify(corps) });
}

async function pennylane(r) {
  if (!Deno.env.get("PENNYLANE_API_TOKEN")) return { statut: "non configuré" };
  try {
    const clientId = (await trouverClient(r)) || (await creerClient(r));
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
<tr><td style="background:${CREME};padding:14px 24px;font-size:11px;color:${GRIS}">CoPanier de fruits au bureau · <a href="${SITE}" style="color:${GRIS}">www.copanier.fr</a> · <a href="mailto:${DESTINATAIRE}" style="color:${GRIS}">${DESTINATAIRE}</a></td></tr>
</table></td></tr></table></body></html>`;
const bloc = (titre, html) => `<tr><td style="padding:18px 24px 4px"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${ORANGE_FONCE};font-weight:bold;border-bottom:1px solid ${LIGNE};padding-bottom:6px;margin-bottom:10px">${titre}</div>${html}</td></tr>`;
const ligne = (lib, val) => (val ? `<tr><td width="170" style="width:170px;padding:5px 14px 5px 0;color:${GRIS};font-size:13px;vertical-align:top">${lib}</td><td style="padding:5px 0;font-size:14px;vertical-align:top">${val}</td></tr>` : "");
const tableau = (lignes) => `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${lignes.join("")}</table>`;
const bouton = (href, txt, fond = ORANGE) => `<a href="${href}" style="display:inline-block;background:${fond};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:999px;margin:0 6px 8px 0">${txt}</a>`;

function blocPennylane(p) {
  if (p.statut === "ok") {
    return `<tr><td style="padding:14px 24px 0"><div style="background:#e8f0eb;border:2px solid ${VERT};border-radius:10px;padding:12px 16px;font-size:14px;line-height:1.5">
<b>🧾 Brouillon de devis créé dans Pennylane${p.numero ? " — n° " + esc(p.numero) : ""}</b><br>Il n'a <b>pas</b> été envoyé au client : vérifiez-le, ajustez prix et quantités si besoin, puis envoyez-le depuis Pennylane.<br>
<a href="https://app.pennylane.com/" style="color:${VERT};font-weight:bold">Ouvrir Pennylane → Ventes → Devis</a></div></td></tr>`;
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let corps;
  try { corps = await req.json(); } catch (_) { return new Response("requête invalide", { status: 400, headers: CORS }); }
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
