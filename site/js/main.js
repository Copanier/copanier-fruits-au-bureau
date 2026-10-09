/* =========================================================
   COPANIER — scripts du site
   ========================================================= */

/* ✏️ DEMANDE DE DEVIS
   Les demandes sont enregistrées dans Supabase, qui envoie aussitôt un e-mail
   récapitulatif à EMAIL_DEVIS. Si l'envoi échoue, le visiteur peut transmettre
   la même demande par e-mail (messagerie, Gmail, Outlook ou copier-coller). */
var EMAIL_DEVIS = "contact@copanier.fr";
var OBJET_DEVIS = "Demande de devis corbeilles de fruits";
/* ⚙️ À RENSEIGNER une fois le projet Supabase CoPanier créé
   (Supabase → Project Settings → API Keys) : URL du projet et clé « publishable » (publique).
   Tant que ces deux lignes sont vides, le formulaire propose l'envoi par e-mail. */
var SUPABASE_URL = "https://eykdcoqdhllbigxujgsl.supabase.co";
var SUPABASE_CLE = "sb_publishable_BHTeFJEowRdZC278ZO9RDQ_q08_-91A";
var TABLE_DEVIS = "devis_copanier";
var FONCTION_DEVIS = "copanier-devis";
var MAX_ADRESSES = 10;

(function () {
  // En mode édition (outil « Modifier le site »), on laisse la page telle quelle.
  if (/[?&]edition/.test(location.search)) return;

  // Chaque page s'ouvre en haut (sauf lien vers une section précise, ex. #tarifs)
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) window.scrollTo(0, 0);

  var doc = document.documentElement;
  doc.classList.add("js");
  var mouvementReduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Mesure d'audience anonyme : page vue + provenance, sans cookie ni identifiant ---------- */
  try {
    if (SUPABASE_URL && /^https:$/.test(location.protocol) && !navigator.webdriver && !/bot|crawl|spider|preview/i.test(navigator.userAgent)) {
      var ref = "";
      try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) {}
      var source = !ref ? "direct"
        : ref === location.hostname.replace(/^www\./, "") ? "interne"
        : /(^|\.)google\./.test(ref) ? "google"
        : /(^|\.)bing\.com$/.test(ref) ? "bing"
        : /chatgpt\.com|openai\.com/.test(ref) ? "chatgpt"
        : /perplexity\.ai/.test(ref) ? "perplexity"
        : /linkedin\.com|lnkd\.in/.test(ref) ? "linkedin"
        : /qwant|duckduckgo|ecosia|yahoo|brave/.test(ref) ? "autres moteurs"
        : /copanier\.fr$/.test(ref) ? "ancien site copanier.fr"
        : ref.slice(0, 40);
      fetch(SUPABASE_URL + "/rest/v1/visites", {
        method: "POST", keepalive: true,
        headers: { apikey: SUPABASE_CLE, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ chemin: location.pathname.slice(0, 200) || "/", source: source })
      }).catch(function () {});
    }
  } catch (e) {}

  /* ---------- Notification ---------- */
  var toast = $(".toast"), toastMinuteur;
  function notifier(texte) {
    if (!toast) return;
    toast.textContent = texte;
    toast.hidden = false;
    clearTimeout(toastMinuteur);
    toastMinuteur = setTimeout(function () { toast.hidden = true; }, 3200);
  }
  function copier(texte, message) {
    var ok = function () { notifier(message || "Copié !"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texte).then(ok, function () { copieSecours(texte); ok(); });
    } else { copieSecours(texte); ok(); }
  }
  function copieSecours(texte) {
    var t = document.createElement("textarea");
    t.value = texte; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) {}
    t.remove();
  }
  function identifiant() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }

  /* ---------- Fenêtre de demande de devis ---------- */
  var fenetre = $("#devis");
  var formulaire = $("#devis-form");

  function adressesLivraison() {
    var f = formulaire.elements;
    if (f.identique.checked) return f.adresse_entreprise.value.trim() ? [f.adresse_entreprise.value.trim()] : [];
    return $$(".devis__liste-livraisons input", formulaire).map(function (i) { return i.value.trim(); }).filter(Boolean);
  }
  function valeurs() {
    var f = formulaire.elements;
    return {
      entreprise: f.entreprise.value.trim(), role: f.role.value.trim(), prenom: f.prenom.value.trim(), nom: f.nom.value.trim(), email: f.email.value.trim(),
      telephone: f.telephone.value.trim(), rappel: f.rappel.checked, creneau: f.rappel.checked ? f.creneau.value : "",
      adresse_entreprise: f.adresse_entreprise.value.trim(), adresses_livraison: adressesLivraison(),
      personnes: f.personnes.value.trim(), formule: f.formule.value, message: f.message.value.trim()
    };
  }
  /* Texte utilisé si l'envoi automatique échoue (e-mail pré-rempli) */
  function texteDemande() {
    var v = valeurs();
    var l = ["Bonjour,", "", "Je souhaite recevoir un devis pour la livraison de corbeilles de fruits au bureau.", ""];
    if (v.rappel) l.push(">> Je souhaite être rappelé(e) au : " + v.telephone + " (" + v.creneau.toLowerCase() + ")", "");
    l.push("Entreprise : " + v.entreprise, "Prénom : " + v.prenom, "Nom : " + v.nom, "Rôle dans l'entreprise : " + v.role, "E-mail : " + v.email, "Téléphone : " + v.telephone);
    l.push("Adresse de l'entreprise : " + v.adresse_entreprise);
    if (v.adresses_livraison.length > 1) {
      l.push("Adresses de livraison :");
      v.adresses_livraison.forEach(function (a, i) { l.push("  " + (i + 1) + ". " + a); });
    } else l.push("Adresse de livraison : " + (v.adresses_livraison[0] || ""));
    l.push("Nombre de personnes : " + v.personnes, "Formule souhaitée : " + v.formule);
    l.push("", "Message : " + v.message, "", "Merci et à bientôt !");
    return l.join("\n");
  }
  function majLiensAlternatifs() {
    var corps = encodeURIComponent(texteDemande()), objet = encodeURIComponent(OBJET_DEVIS);
    var m = $('[data-envoi="mail"]', formulaire), g = $('[data-envoi="gmail"]', formulaire), o = $('[data-envoi="outlook"]', formulaire);
    if (m) m.href = "mailto:" + EMAIL_DEVIS + "?subject=" + objet + "&body=" + corps;
    if (g) g.href = "https://mail.google.com/mail/?view=cm&fs=1&to=" + EMAIL_DEVIS + "&su=" + objet + "&body=" + corps;
    if (o) o.href = "https://outlook.office.com/mail/deeplink/compose?to=" + EMAIL_DEVIS + "&subject=" + objet + "&body=" + corps;
  }
  function erreur(message, champ) {
    var zone = $(".devis__erreur", formulaire);
    $$(".invalide", formulaire).forEach(function (c) { c.classList.remove("invalide"); });
    zone.hidden = !message;
    zone.textContent = message || "";
    if (champ) { champ.classList.add("invalide"); champ.focus(); }
    return !message;
  }
  // Il faut de quoi recontacter le visiteur : un e-mail valide, ou un téléphone s'il demande à être rappelé.
  function verifier() {
    var f = formulaire.elements, email = f.email.value.trim(), tel = f.telephone.value.trim();
    if (f.rappel.checked && !tel) return erreur("Indiquez votre numéro de téléphone pour être rappelé.", f.telephone);
    if (email && !/^[^\s@<>,;]+@[^\s@<>,;]+\.[a-z]{2,}$/i.test(email)) return erreur("Cette adresse e-mail semble incomplète.", f.email);
    if (!email && !tel) return erreur("Indiquez votre e-mail (ou votre téléphone) pour que nous puissions vous répondre.", f.email);
    return erreur("");
  }
  function majRappel() {
    var coche = formulaire.elements.rappel.checked;
    $(".devis__creneau", formulaire).hidden = !coche;
    $(".devis__tel", formulaire).classList.toggle("requis", coche);
    formulaire.classList.toggle("avec-rappel", coche);
  }
  function majIdentique() {
    var coche = formulaire.elements.identique.checked;
    $(".devis__liste-livraisons", formulaire).hidden = coche;
    $("[data-ajouter-adresse]", formulaire).hidden = coche;
  }
  function ajouterAdresse(valeur) {
    var liste = $(".devis__liste-livraisons", formulaire);
    var n = liste.children.length + 1;
    if (n > MAX_ADRESSES) return;
    var li = document.createElement("li");
    var champ = document.createElement("input");
    champ.name = "livraison"; champ.id = "devis-livraison-" + n; champ.placeholder = "N°, rue, code postal, ville";
    champ.setAttribute("aria-label", "Adresse de livraison " + n);
    if (valeur) champ.value = valeur;
    var retirer = document.createElement("button");
    retirer.type = "button"; retirer.className = "devis__retirer"; retirer.setAttribute("aria-label", "Retirer cette adresse"); retirer.textContent = "×";
    retirer.addEventListener("click", function () { li.remove(); renumeroter(); majLiensAlternatifs(); });
    li.appendChild(champ); li.appendChild(retirer); liste.appendChild(li);
    $("[data-ajouter-adresse]", formulaire).disabled = liste.children.length >= MAX_ADRESSES;
    champ.focus();
  }
  function renumeroter() {
    $$(".devis__liste-livraisons input", formulaire).forEach(function (c, i) {
      c.id = "devis-livraison-" + (i + 1); c.setAttribute("aria-label", "Adresse de livraison " + (i + 1));
    });
    $("[data-ajouter-adresse]", formulaire).disabled = false;
  }
  function etat(nom) {
    $(".devis__etape-saisie", formulaire).hidden = nom === "merci";
    $(".devis__etape-merci", formulaire).hidden = nom !== "merci";
    $(".devis__alternatives", formulaire).hidden = nom !== "secours";
  }
  function ouvrirDevis(personnes, rappel) {
    if (!fenetre || typeof fenetre.showModal !== "function") return false;
    if (!$(".devis__etape-merci", formulaire).hidden) { formulaire.reset(); $$(".devis__liste-livraisons li", formulaire).slice(1).forEach(function (li) { li.remove(); }); }
    etat("saisie");
    if (personnes) formulaire.elements.personnes.value = personnes;
    if (rappel) formulaire.elements.rappel.checked = true;
    majRappel(); majIdentique(); majLiensAlternatifs(); erreur("");
    fenetre.showModal();
    setTimeout(function () { (rappel ? formulaire.elements.telephone : formulaire.elements.entreprise).focus(); }, 50);
    return true;
  }
  function envoyer() {
    var v = valeurs();
    var id = identifiant();
    var ligne = {
      id: id, entreprise: v.entreprise, role: v.role, prenom: v.prenom, nom: v.nom, email: v.email, telephone: v.telephone,
      rappel: v.rappel, creneau: v.creneau, adresse_entreprise: v.adresse_entreprise,
      adresses_livraison: v.adresses_livraison, personnes: v.personnes ? parseInt(v.personnes, 10) : null,
      formule: v.formule, message: v.message, page: location.pathname
    };
    if (!SUPABASE_URL || !SUPABASE_CLE) return Promise.reject(new Error("Supabase non configuré"));
    var entetes = { apikey: SUPABASE_CLE, "Content-Type": "application/json" };
    // Les anciennes clés « anon » (format JWT) s'envoient aussi en en-tête Authorization
    if (/^eyJ/.test(SUPABASE_CLE)) entetes.Authorization = "Bearer " + SUPABASE_CLE;
    return fetch(SUPABASE_URL + "/rest/v1/" + TABLE_DEVIS, {
      method: "POST", headers: Object.assign({ Prefer: "return=minimal" }, entetes), body: JSON.stringify(ligne)
    }).then(function (r) {
      if (!r.ok) throw new Error("enregistrement " + r.status);
      // Demande l'envoi de l'e-mail récapitulatif (la fonction relit la demande dans la base)
      fetch(SUPABASE_URL + "/functions/v1/" + FONCTION_DEVIS, { method: "POST", headers: entetes, body: JSON.stringify({ id: id }), keepalive: true })
        .catch(function () {});
    });
  }

  if (fenetre && formulaire) {
    // Tous les boutons « devis » ouvrent la fenêtre (le lien mailto reste en secours sans JavaScript).
    document.addEventListener("click", function (e) {
      var lien = e.target.closest && e.target.closest("a.js-devis");
      if (!lien) return;
      if (ouvrirDevis(lien.getAttribute("data-personnes"), lien.hasAttribute("data-rappel"))) e.preventDefault();
    });
    formulaire.elements.rappel.addEventListener("change", majRappel);
    formulaire.elements.identique.addEventListener("change", majIdentique);
    $("[data-ajouter-adresse]", formulaire).addEventListener("click", function () { ajouterAdresse(); });
    formulaire.addEventListener("input", function (e) {
      if (e.target.classList) e.target.classList.remove("invalide");
      majLiensAlternatifs();
    });
    formulaire.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!verifier()) return;
      if (formulaire.elements.site_web.value) { etat("merci"); return; } // robot : on ne transmet rien
      var btn = $(".devis__envoyer", formulaire), texte = $("span", btn);
      btn.disabled = true; texte.textContent = "Envoi en cours…";
      envoyer().then(function () {
        $(".devis__merci-rappel", formulaire).hidden = !formulaire.elements.rappel.checked;
        etat("merci");
      }).catch(function () {
        majLiensAlternatifs();
        etat("secours");
        $(".devis__alternatives", formulaire).scrollIntoView({ block: "nearest", behavior: "smooth" });
      }).then(function () { btn.disabled = false; texte.textContent = "Envoyer ma demande"; });
    });
    $$("[data-envoi]", formulaire).forEach(function (el) {
      el.addEventListener("click", function () {
        majLiensAlternatifs();
        if (el.getAttribute("data-envoi") === "copier") {
          copier("À : " + EMAIL_DEVIS + "\nObjet : " + OBJET_DEVIS + "\n\n" + texteDemande(), "Demande copiée : collez-la dans un e-mail à " + EMAIL_DEVIS);
        }
      });
    });
    $$("[data-copier]", formulaire).forEach(function (el) {
      el.addEventListener("click", function () { copier(el.getAttribute("data-copier"), "Adresse copiée : " + el.getAttribute("data-copier")); });
    });
    $$("[data-fermer]", formulaire).forEach(function (b) { b.addEventListener("click", function () { fenetre.close(); }); });
    fenetre.addEventListener("click", function (e) { if (e.target === fenetre) fenetre.close(); });
  }

  /* ---------- Menu mobile ---------- */
  var bouton = $(".menu-bouton"), menu = $("#menu");
  if (bouton && menu) {
    bouton.addEventListener("click", function () {
      var ouvert = menu.classList.toggle("ouvert");
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
      bouton.textContent = ouvert ? "Fermer" : "Menu";
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.classList.remove("ouvert"); bouton.textContent = "Menu"; bouton.setAttribute("aria-expanded", "false"); }); });
  }

  /* ---------- Année du pied de page ---------- */
  $$(".js-annee").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- En-tête, barre de progression, retour en haut ---------- */
  var entete = $(".entete");
  var progression = document.createElement("div");
  progression.className = "progression";
  document.body.appendChild(progression);
  var haut = document.createElement("button");
  haut.className = "haut-page"; haut.type = "button"; haut.setAttribute("aria-label", "Revenir en haut de la page"); haut.textContent = "↑";
  haut.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: mouvementReduit ? "auto" : "smooth" }); });
  document.body.appendChild(haut);
  var flottant = $(".devis-flottant");
  var fruits = $$("[data-parallaxe]");
  var enAttente = false;
  function surDefilement() {
    enAttente = false;
    var y = window.scrollY, max = doc.scrollHeight - window.innerHeight;
    if (entete) entete.classList.toggle("defile", y > 20);
    progression.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    haut.classList.toggle("visible", y > 900);
    if (flottant) flottant.classList.toggle("cache", y < 300 || window.innerHeight + y > doc.scrollHeight - 120);
    if (!mouvementReduit) fruits.forEach(function (f) { f.style.transform = "translateY(" + (y * parseFloat(f.getAttribute("data-parallaxe")) / 100) + "px) rotate(" + (y / 40) + "deg)"; });
  }
  window.addEventListener("scroll", function () { if (!enAttente) { enAttente = true; requestAnimationFrame(surDefilement); } }, { passive: true });
  surDefilement();

  /* ---------- Apparition des blocs au défilement ---------- */
  $$(".carte, .section h2, .intro, .duo > *, .faq details, .article > *").forEach(function (el) {
    if (!el.closest(".heros") && !el.closest(".apparition")) el.classList.add("apparition");
  });
  // Décalage en cascade dans les grilles
  $$(".grille, .pilules").forEach(function (g) {
    $$(":scope > .apparition", g).forEach(function (el, i) { el.style.setProperty("--delai", (i * 0.09) + "s"); });
  });
  var elements = $$(".apparition");
  if ("IntersectionObserver" in window && !mouvementReduit) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    elements.forEach(function (el) { obs.observe(el); });
  } else {
    elements.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Compteurs animés ---------- */
  var compteurs = $$(".compteur");
  if (compteurs.length && "IntersectionObserver" in window && !mouvementReduit) {
    var obsC = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        obsC.unobserve(en.target);
        var el = en.target, cible = parseInt(el.textContent, 10) || 0, debut = null;
        if (cible < 2) return;
        el.textContent = "0";
        (function pas(t) {
          if (!debut) debut = t;
          var p = Math.min((t - debut) / 1400, 1);
          el.textContent = Math.round(cible * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(pas);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    compteurs.forEach(function (c) { obsC.observe(c); });
  }

  /* ---------- Bande clients qui défile (on double la liste pour une boucle continue) ---------- */
  $$(".defilement .clients").forEach(function (ul) {
    $$("li", ul).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); $$("a", c).forEach(function (a) { a.tabIndex = -1; }); ul.appendChild(c); });
  });

  /* ---------- Fruits de saison ---------- */
  $$("[data-saisons]").forEach(function (bloc) {
    var boutons = $$("[data-mois]", bloc), panneaux = $$("[data-panneau]", bloc);
    function choisir(m) {
      boutons.forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-mois") === String(m) ? "true" : "false"); });
      panneaux.forEach(function (p) { p.hidden = p.getAttribute("data-panneau") !== String(m); });
    }
    boutons.forEach(function (b) { b.addEventListener("click", function () { choisir(b.getAttribute("data-mois")); }); });
    var maintenant = new Date().getMonth() + 1;
    var bm = $('[data-mois="' + maintenant + '"]', bloc);
    if (bm) { bm.classList.add("maintenant"); bm.title = "Ce mois-ci"; }
    choisir(maintenant);
  });
  // Calendrier et fiches fruits : colonne du mois en cours
  $$('[data-mois-col="' + (new Date().getMonth() + 1) + '"]').forEach(function (el) { el.classList.add("maintenant"); });

  /* ---------- Comparateur des fruits : tri au clic sur l'en-tête ---------- */
  $$("table[data-tri]").forEach(function (table) {
    var corps = table.tBodies[0];
    $$("thead th", table).forEach(function (th, col) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = th.textContent;
      th.textContent = "";
      th.appendChild(b);
      b.addEventListener("click", function () {
        var asc = th.getAttribute("aria-sort") === "descending";
        $$("thead th", table).forEach(function (t) { t.removeAttribute("aria-sort"); });
        th.setAttribute("aria-sort", asc ? "ascending" : "descending");
        var lignes = Array.prototype.slice.call(corps.rows);
        lignes.sort(function (a, z) {
          var va = a.cells[col].getAttribute("data-valeur"), vz = z.cells[col].getAttribute("data-valeur");
          var r = va !== null ? parseFloat(va) - parseFloat(vz) : a.cells[col].textContent.localeCompare(z.cells[col].textContent, "fr");
          if (col > 0 && va !== null) r = -r; // chiffres : du plus grand au plus petit au premier clic
          return asc ? -r : r;
        });
        lignes.forEach(function (tr) { corps.appendChild(tr); });
      });
    });
  });

  /* ---------- Simulateur de quantité ----------
     Les formats et les prix sont lus dans le tableau des tarifs de la page :
     modifiez le tableau, le simulateur suit automatiquement. */
  var formats = $$("table.tarifs tbody tr").map(function (tr) {
    var c = tr.querySelectorAll("td");
    var nb = function (s) { return parseFloat(String(s).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "")); };
    var pers = (c[2] ? c[2].textContent : "").match(/\d+/g) || [];
    return { tr: tr, kg: nb(c[0] && c[0].textContent), prix: nb(c[1] && c[1].textContent), max: pers.length ? parseInt(pers[pers.length - 1], 10) : 0 };
  }).filter(function (f) { return f.kg && f.prix && f.max; });
  var euros = function (n) { return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € HT"; };

  $$("[data-calculateur]").forEach(function (calc) {
    var champ = $(".calc-personnes", calc), curseur = $(".calc-curseur", calc);
    var sKg = $(".calc-kg", calc), sPrix = $(".calc-prix", calc), devis = $(".calc-devis", calc);
    function afficher(el, txt) { if (el && el.textContent !== txt) { el.textContent = txt; el.classList.remove("change"); void el.offsetWidth; el.classList.add("change"); } }
    function maj(source) {
      var n = parseInt(source.value, 10);
      if (!n || n < 1) n = 1;
      if (source === champ) curseur.value = Math.min(Math.max(n, +curseur.min), +curseur.max); else champ.value = n;
      var f = null;
      for (var i = 0; i < formats.length; i++) { if (n <= formats[i].max + 2) { f = formats[i]; break; } }
      formats.forEach(function (x) { x.tr.classList.toggle("actif", x === f); });
      if (f) {
        afficher(sKg, String(f.kg).replace(".", ",") + " kg");
        afficher(sPrix, euros(f.prix));
      } else {
        var dernier = formats[formats.length - 1];
        var kg = dernier ? Math.ceil(n * dernier.kg / dernier.max) : Math.ceil(n / 3);
        afficher(sKg, "≈ " + kg + " kg");
        afficher(sPrix, "Sur devis");
      }
      if (devis) devis.setAttribute("data-personnes", n);
    }
    champ.addEventListener("input", function () { maj(champ); });
    curseur.addEventListener("input", function () { maj(curseur); });
    maj(champ);
  });

  /* ---------- Animations SVG : pause si l'utilisateur préfère moins de mouvement ---------- */
  if (mouvementReduit) $$("svg").forEach(function (s) { if (s.pauseAnimations) { s.setCurrentTime(3.5); s.pauseAnimations(); } });
})();
