// @ts-nocheck
// =====================================================================
// Fonction Supabase « copanier-boutique » — boutique sapins & boissons
//
// 1. { action: "paiement", reference, vague, articles: [{id, quantite, sans_pied}], retour }
//    → vérifie le code entreprise (table sapins_entreprises), la date limite, les articles
//      et recalcule les prix ICI (le navigateur ne fixe jamais un prix), enregistre la commande
//      « en_attente » et crée la page de paiement Stripe Checkout. Renvoie { url }.
// 2. Notifications Stripe (en-tête stripe-signature) : paiement réussi → commande « payee »
//    + e-mail à contact@copanier.fr ; session expirée → « expiree » ; remboursement → « remboursee ».
// 3. { action: "recap", vague: "V1" } (tâche planifiée) → e-mail du récapitulatif par entreprise
//    et par article, prêt pour la commande fournisseur.
//
// Secrets (Supabase → Edge Functions → Secrets), à saisir par vous :
//   STRIPE_SECRET_KEY      clé secrète Stripe (de préférence une clé restreinte « Checkout Sessions : écriture »)
//   STRIPE_WEBHOOK_SECRET  secret de signature du webhook Stripe (whsec_…)
//   STRIPE_TVA_10 / STRIPE_TVA_20   facultatifs : identifiants des taux de TVA Stripe (txr_…), prix TTC
//   RESEND_API_KEY, EXPEDITEUR      déjà utilisés par la fonction copanier-devis
// =====================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CATALOGUE-DEBUT (généré par outils/page-sapins.mjs — ne pas modifier à la main)
const CATALOGUE = {
  "_note": "Généré par outils/page-sapins.mjs — ne pas modifier à la main. Prix TTC en euros.",
  "annee": 2026,
  "vagues": [
    {
      "id": "V1",
      "fin": "2026-11-29T23:59:59+01:00",
      "livraison": "jeudi 3 décembre"
    },
    {
      "id": "V2",
      "fin": "2026-12-03T23:59:59+01:00",
      "livraison": "mercredi 9 décembre"
    }
  ],
  "sans_pied": {
    "remise": 2
  },
  "tva": {
    "sapins": "10 %",
    "boissons": "20 %"
  },
  "articles": [
    {
      "id": "sapin-100-125-cm",
      "nom": "Sapin Nordmann 100/125 cm",
      "prix": 40,
      "type": "sapin"
    },
    {
      "id": "sapin-125-150-cm",
      "nom": "Sapin Nordmann 125/150 cm",
      "prix": 46,
      "type": "sapin"
    },
    {
      "id": "sapin-150-175-cm",
      "nom": "Sapin Nordmann 150/175 cm",
      "prix": 62,
      "type": "sapin"
    },
    {
      "id": "sapin-175-200-cm",
      "nom": "Sapin Nordmann 175/200 cm",
      "prix": 79,
      "type": "sapin"
    },
    {
      "id": "sapin-200-250-cm",
      "nom": "Sapin Nordmann 200/250 cm",
      "prix": 99,
      "type": "sapin"
    },
    {
      "id": "boisson-blanc-de-noirs",
      "nom": "Blanc de noirs (Bouteille 75 cl)",
      "prix": 25,
      "type": "boisson"
    },
    {
      "id": "boisson-paul-augustin-brut",
      "nom": "Paul Augustin Brut (Bouteille 75 cl)",
      "prix": 25,
      "type": "boisson"
    },
    {
      "id": "boisson-millesime-2012",
      "nom": "Millésime 2012 (Bouteille 75 cl)",
      "prix": 29,
      "type": "boisson"
    },
    {
      "id": "boisson-ratafia-pinot-noir",
      "nom": "Ratafia Pinot Noir (70 cl)",
      "prix": 28,
      "type": "boisson"
    },
    {
      "id": "boisson-ratafia-chardonnay",
      "nom": "Ratafia Chardonnay (70 cl)",
      "prix": 28,
      "type": "boisson"
    },
    {
      "id": "boisson-gin-sauvage",
      "nom": "Gin Sauvage (70 cl)",
      "prix": 39,
      "type": "boisson"
    },
    {
      "id": "boisson-whisky",
      "nom": "Whisky (70 cl)",
      "prix": 48,
      "type": "boisson"
    }
  ]
};
// CATALOGUE-FIN

const DESTINATAIRE = "contact@copanier.fr";
const EXPEDITEUR = Deno.env.get("EXPEDITEUR") || "CoPanier de fruits au bureau <onboarding@resend.dev>";
const RETOURS_AUTORISES = ["https://copanierdefruits.copanier.fr/", "https://www.copanier.fr/", "http://localhost:4321/"];
const MAX_PAR_ARTICLE = 20, MAX_ARTICLES = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corps, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const euros = (n) => Number(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const normaliser = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// ---------- Base de données (clé de service) ----------
const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_CLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = (chemin, options = {}) => fetch(`${SB_URL}/rest/v1/${chemin}`, {
  ...options, headers: { apikey: SB_CLE, Authorization: `Bearer ${SB_CLE}`, "Content-Type": "application/json", ...(options.headers || {}) },
});

// ---------- Stripe ----------
function formulaire(obj, prefixe = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const cle = prefixe ? `${prefixe}[${k}]` : k;
    if (typeof v === "object") formulaire(v, cle, out); else out.append(cle, String(v));
  }
  return out;
}
async function stripe(chemin, corps) {
  const r = await fetch("https://api.stripe.com/v1/" + chemin, {
    method: "POST",
    headers: { Authorization: "Bearer " + Deno.env.get("STRIPE_SECRET_KEY"), "Content-Type": "application/x-www-form-urlencoded" },
    body: formulaire(corps),
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Stripe : " + (j.error?.message || r.status));
  return j;
}
async function stripeLire(chemin) {
  const r = await fetch("https://api.stripe.com/v1/" + chemin, { headers: { Authorization: "Bearer " + Deno.env.get("STRIPE_SECRET_KEY") } });
  return r.ok ? await r.json() : null;
}
async function signatureValide(corpsBrut, entete) {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret || !entete) return false;
  const parts = Object.fromEntries(entete.split(",").map((x) => x.split("=")));
  const t = parts.t, v1s = entete.split(",").filter((x) => x.startsWith("v1=")).map((x) => x.slice(3));
  if (!t || !v1s.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(`${t}.${corpsBrut}`)));
  const hex = Array.from(sig, (o) => o.toString(16).padStart(2, "0")).join("");
  return v1s.includes(hex);
}

async function envoyerMail(subject, html) {
  const cle = Deno.env.get("RESEND_API_KEY");
  if (!cle) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EXPEDITEUR, to: [DESTINATAIRE], subject, html }),
  });
  return r.ok;
}

// ---------- 1. Création du paiement ----------
async function creerPaiement(d) {
  if (!Deno.env.get("STRIPE_SECRET_KEY")) return json({ erreur: "paiement non configuré" }, 503);
  const reference = normaliser(d.reference);
  const r = await sb(`sapins_entreprises?reference=eq.${encodeURIComponent(reference)}&select=reference,entreprise,adresse`);
  const ent = r.ok ? (await r.json())[0] : null;
  if (!ent) return json({ erreur: "Code entreprise non reconnu." }, 400);

  const vague = (CATALOGUE.vagues || []).find((v) => v.id === d.vague);
  if (!vague) return json({ erreur: "Date de livraison inconnue." }, 400);
  if (new Date(vague.fin).getTime() <= Date.now()) return json({ erreur: "Les commandes pour cette date de livraison sont closes." }, 400);

  const lignes = [];
  let total = 0, nb = 0, sansPied = false;
  for (const a of Array.isArray(d.articles) ? d.articles : []) {
    const art = (CATALOGUE.articles || []).find((x) => x.id === a.id);
    const q = Math.floor(Number(a.quantite));
    if (!art || !(q >= 1 && q <= MAX_PAR_ARTICLE)) return json({ erreur: "Article ou quantité invalide." }, 400);
    const sp = art.type === "sapin" && a.sans_pied === true && CATALOGUE.sans_pied;
    const pu = art.prix - (sp ? CATALOGUE.sans_pied.remise : 0);
    if (sp) sansPied = true;
    lignes.push({ id: art.id, nom: art.nom + (art.type === "sapin" ? (sp ? " – sans pied" : " – avec pied") : ""), quantite: q, prix_unitaire: pu, sans_pied: !!sp, type: art.type });
    total += pu * q; nb += q;
  }
  if (!lignes.length || nb > MAX_ARTICLES) return json({ erreur: "Commande vide ou trop importante." }, 400);

  const retour = RETOURS_AUTORISES.find((u) => String(d.retour || "").startsWith(u)) ? String(d.retour).split(/[?#]/)[0] : RETOURS_AUTORISES[0] + "sapins-de-noel/";
  const tva = (type) => Deno.env.get(type === "sapin" ? "STRIPE_TVA_10" : "STRIPE_TVA_20");
  const session = await stripe("checkout/sessions", {
    mode: "payment",
    locale: "fr",
    success_url: retour + "?paiement=ok&session={CHECKOUT_SESSION_ID}",
    cancel_url: retour + "?paiement=annule",
    client_reference_id: `${reference}-${vague.id}${sansPied ? "-SP" : ""}`,
    phone_number_collection: { enabled: true },
    billing_address_collection: "auto",
    custom_fields: [
      { key: "prenom", label: { type: "custom", custom: "Prénom (étiquette de la commande)" }, type: "text" },
      { key: "nom", label: { type: "custom", custom: "Nom (étiquette de la commande)" }, type: "text" },
      { key: "service", label: { type: "custom", custom: "Service ou étage" }, type: "text", optional: true },
    ],
    custom_text: { submit: { message: `Livraison dans votre entreprise (${ent.entreprise}) le ${vague.livraison}. Votre prénom et votre nom figureront sur l'étiquette de votre commande. Un récépissé de paiement vous sera envoyé par e-mail.` } },
    metadata: { reference, entreprise: ent.entreprise, vague: vague.id, livraison: vague.livraison },
    payment_intent_data: { description: `Commande sapins/boissons – ${ent.entreprise} – livraison ${vague.livraison}`, metadata: { reference, vague: vague.id } },
    line_items: lignes.map((l) => ({
      quantity: l.quantite,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(l.prix_unitaire * 100),
        tax_behavior: "inclusive",
        product_data: { name: l.nom },
      },
      ...(tva(l.type) ? { tax_rates: [tva(l.type)] } : {}),
    })),
  });

  await sb("commandes_boutique", {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ session_id: session.id, reference, entreprise: ent.entreprise, adresse: ent.adresse, vague: vague.id, livraison: vague.livraison, articles: lignes, total_ttc: Math.round(total * 100) / 100 }),
  });
  return json({ url: session.url });
}

// ---------- 2. Notifications Stripe ----------
async function notificationStripe(req) {
  const brut = await req.text();
  if (!(await signatureValide(brut, req.headers.get("stripe-signature")))) return json({ erreur: "signature invalide" }, 400);
  const ev = JSON.parse(brut);
  const o = ev.data?.object || {};
  if (ev.type === "checkout.session.completed" && o.payment_status === "paid") {
    const champ = (k) => (o.custom_fields || []).find((f) => f.key === k)?.text?.value || null;
    const maj = { statut: "payee", payee_le: new Date().toISOString(), payment_intent: o.payment_intent, client_prenom: champ("prenom"), client_nom: champ("nom"), service: champ("service"), client_email: o.customer_details?.email || null, client_tel: o.customer_details?.phone || null };
    const r = await sb(`commandes_boutique?session_id=eq.${o.id}&statut=neq.payee`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(maj) });
    const c = r.ok ? (await r.json())[0] : null;
    if (c) {
      const lignes = (c.articles || []).map((l) => `<li>${l.quantite} × ${esc(l.nom)} — ${euros(l.prix_unitaire * l.quantite)}</li>`).join("");
      await envoyerMail(`🎄 Nouvelle commande ${numeroCommande(c.id)} — ${c.entreprise} — ${euros(c.total_ttc)} (livraison ${c.livraison})`,
        `<p><b>${esc(maj.client_prenom)} ${esc(maj.client_nom)}</b>${maj.service ? " — " + esc(maj.service) : ""}<br>${esc(c.entreprise)}, ${esc(c.adresse)}<br>Livraison : <b>${esc(c.livraison)}</b> (${esc(c.vague)})</p><ul>${lignes}</ul><p>Total TTC : <b>${euros(c.total_ttc)}</b><br>${esc(maj.client_email)} · ${esc(maj.client_tel)}</p>`);
    }
  } else if (ev.type === "checkout.session.expired") {
    await sb(`commandes_boutique?session_id=eq.${o.id}&statut=eq.en_attente`, { method: "PATCH", body: JSON.stringify({ statut: "expiree" }) });
  } else if (ev.type === "charge.refunded" && o.payment_intent && o.refunded) {
    await sb(`commandes_boutique?payment_intent=eq.${o.payment_intent}`, { method: "PATCH", body: JSON.stringify({ statut: "remboursee" }) });
  }
  return json({ recu: true });
}

// ---------- 2 bis. Page de confirmation après paiement ----------
// L'identifiant de session Stripe (long et aléatoire) n'est connu que de l'acheteur : il sert de clé de lecture.
const numeroCommande = (id) => "CP-" + String(id).padStart(5, "0");
async function confirmation(d) {
  const id = String(d.session || "");
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,250}$/.test(id)) return json({ erreur: "Commande introuvable." }, 400);
  const r = await sb(`commandes_boutique?session_id=eq.${id}&select=id,statut,entreprise,adresse,livraison,articles,total_ttc,client_prenom,client_email`);
  const c = r.ok ? (await r.json())[0] : null;
  if (!c) return json({ erreur: "Commande introuvable." }, 404);
  let statut = c.statut, prenom = c.client_prenom, email = c.client_email;
  // La notification Stripe peut arriver quelques secondes après le retour du client : on vérifie directement chez Stripe
  if (statut === "en_attente") {
    const ses = await stripeLire("checkout/sessions/" + id);
    if (ses?.payment_status === "paid") {
      statut = "payee";
      prenom = prenom || (ses.custom_fields || []).find((f) => f.key === "prenom")?.text?.value || null;
      email = email || ses.customer_details?.email || null;
    } else if (ses?.status === "expired") statut = "expiree";
  }
  return json({
    numero: numeroCommande(c.id), statut, prenom, email,
    entreprise: c.entreprise, adresse: c.adresse, livraison: c.livraison, total_ttc: c.total_ttc,
    articles: (c.articles || []).map((l) => ({ nom: l.nom, quantite: l.quantite, prix_unitaire: l.prix_unitaire })),
  });
}

// ---------- 3. Récapitulatif d'une livraison (commande fournisseur et préparation) ----------
async function recapitulatif(vagueId) {
  const vague = (CATALOGUE.vagues || []).find((v) => v.id === vagueId);
  if (!vague) return json({ erreur: "vague inconnue" }, 400);
  const r = await sb(`commandes_boutique?vague=eq.${vague.id}&statut=eq.payee&select=*&order=entreprise.asc,client_nom.asc`);
  const commandes = r.ok ? await r.json() : [];
  const parArticle = {}, parEntreprise = {};
  for (const c of commandes) {
    (parEntreprise[c.entreprise] ||= []).push(c);
    for (const l of c.articles || []) parArticle[l.nom] = (parArticle[l.nom] || 0) + l.quantite;
  }
  const html = `<h2>Livraison du ${esc(vague.livraison)} — ${commandes.length} commande(s)</h2>
<h3>À commander</h3><ul>${Object.entries(parArticle).sort().map(([n, q]) => `<li><b>${q}</b> × ${esc(n)}</li>`).join("") || "<li>Aucune commande</li>"}</ul>
<h3>Par entreprise (étiquettes)</h3>${Object.entries(parEntreprise).map(([e, cs]) => `<p><b>${esc(e)}</b> — ${esc(cs[0].adresse)} (${cs.reduce((n, c) => n + c.articles.reduce((m, l) => m + l.quantite, 0), 0)} article(s))</p><ul>${cs.map((c) => `<li>${esc(c.client_prenom)} ${esc(c.client_nom)}${c.service ? " (" + esc(c.service) + ")" : ""} : ${c.articles.map((l) => l.quantite + " × " + esc(l.nom)).join(", ")}</li>`).join("")}</ul>`).join("")}`;
  const ok = await envoyerMail(`📋 Récapitulatif sapins & boissons — livraison du ${vague.livraison}`, html);
  return json({ commandes: commandes.length, envoye: ok });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "méthode" }, 405);
  try {
    if (req.headers.get("stripe-signature")) return await notificationStripe(req);
    const d = await req.json().catch(() => ({}));
    if (d.action === "paiement") return await creerPaiement(d);
    if (d.action === "recap") return await recapitulatif(d.vague);
    if (d.action === "confirmation") return await confirmation(d);
    return json({ erreur: "action inconnue" }, 400);
  } catch (e) {
    console.error("copanier-boutique", e);
    return json({ erreur: "indisponible" }, 500);
  }
});
