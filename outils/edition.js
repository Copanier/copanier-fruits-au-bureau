/* =========================================================
   COPANIER — outil de modification des textes
   Chargé uniquement par le serveur local (« Modifier le site.bat »).
   ========================================================= */
(function () {
  var enEdition = /[?&]edition/.test(location.search);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    e.setAttribute("data-edition-injecte", "");
    return e;
  }

  // Hors mode édition : un simple bouton pour y entrer.
  if (!enEdition) {
    var entrer = el("a", { class: "ed-entrer", href: location.pathname + "?edition" }, "✏️ Modifier cette page");
    document.body.appendChild(entrer);
    return;
  }

  document.body.classList.add("edition-actif");
  var modifie = false;

  /* ---------- Textes modifiables ---------- */
  var SELECTEUR = "h1, h2, h3, p, li, summary, td, th, figcaption, blockquote, a.bouton, .lire, .offre__etiquette, .saisons__mois button, .chiffre > strong, .chiffre > span, .heros__pastille > strong, .heros__pastille > span:not(.drapeau)";
  var zone = $$("main"); // l'en-tête et le pied de page sont communs à toutes les pages : non modifiables ici
  var editables = [];
  zone.forEach(function (racine) {
    $$(SELECTEUR, racine).forEach(function (n) {
      if (n.closest("[contenteditable]") || n.closest("[data-edition-injecte]") || n.closest("svg")) return;
      if (!n.textContent.trim()) return;
      n.setAttribute("contenteditable", "true");
      n.setAttribute("spellcheck", "true");
      editables.push(n);
    });
  });

  // Afficher tout ce qui est replié pour pouvoir le modifier (remis en place à l'enregistrement).
  $$("details:not([open])").forEach(function (d) { d.open = true; d.setAttribute("data-edition-ouvert", ""); });
  $$("[hidden]", $("main")).forEach(function (h) { h.hidden = false; h.setAttribute("data-edition-cache", ""); });

  // Pas de navigation au clic pendant la modification
  document.addEventListener("click", function (e) {
    var cible = e.target.closest && e.target.closest("a, summary, button");
    if (!cible || cible.closest("[data-edition-injecte]")) return;
    if (cible.hasAttribute("contenteditable") || cible.closest("[contenteditable]") || cible.tagName === "A" || cible.tagName === "SUMMARY") e.preventDefault();
  }, true);

  document.addEventListener("input", function (e) {
    if (e.target.closest && e.target.closest("[contenteditable]")) marquer();
  });
  // Entrée = retour à la ligne simple ; coller = texte sans mise en forme
  document.addEventListener("keydown", function (e) {
    var c = e.target.closest && e.target.closest("[contenteditable]");
    if (!c) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (/^(P|LI|BLOCKQUOTE|FIGCAPTION|TD)$/.test(c.tagName)) document.execCommand("insertLineBreak");
    }
    if (e.key === " " && c.tagName === "SUMMARY") { e.preventDefault(); document.execCommand("insertText", false, " "); }
  });
  document.addEventListener("paste", function (e) {
    if (!(e.target.closest && e.target.closest("[contenteditable]"))) return;
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, t);
  });

  /* ---------- Barre d'outils ---------- */
  var titre = $("title"), desc = $('meta[name="description"]');
  var barre = el("div", { class: "ed-barre", role: "region", "aria-label": "Outil de modification" },
    '<div class="ed-gauche"><strong>✏️ Mode modification</strong><span class="ed-etat">Cliquez sur un texte pour le modifier</span></div>' +
    '<div class="ed-droite">' +
    '<label class="ed-pages">Page : <select></select></label>' +
    '<button type="button" class="ed-btn ed-google">Titre Google</button>' +
    '<a class="ed-btn" href="' + location.pathname + '" target="_blank" rel="noopener">Aperçu</a>' +
    '<button type="button" class="ed-btn ed-annuler">Annuler</button>' +
    '<button type="button" class="ed-btn ed-principal ed-enregistrer">Enregistrer</button>' +
    '</div>');
  document.body.appendChild(barre);

  var panneau = el("div", { class: "ed-panneau", hidden: "" },
    '<h3>Ce qui s\'affiche dans Google</h3>' +
    '<label>Titre (60 caractères max. conseillé) <span class="ed-compte" data-pour="t"></span><input type="text" class="ed-titre"></label>' +
    '<label>Description (155 caractères max. conseillé) <span class="ed-compte" data-pour="d"></span><textarea rows="3" class="ed-desc"></textarea></label>' +
    '<div class="ed-apercu"><span class="ed-apercu-url">copanier.fr' + location.pathname.replace(/\/$/, "") + '</span><span class="ed-apercu-titre"></span><span class="ed-apercu-desc"></span></div>' +
    '<button type="button" class="ed-btn ed-principal ed-fermer">OK</button>');
  document.body.appendChild(panneau);
  var champT = $(".ed-titre", panneau), champD = $(".ed-desc", panneau);
  champT.value = titre.textContent; champD.value = desc ? desc.getAttribute("content") : "";
  function majApercu() {
    $(".ed-apercu-titre", panneau).textContent = champT.value;
    $(".ed-apercu-desc", panneau).textContent = champD.value;
    $('[data-pour="t"]', panneau).textContent = champT.value.length + " car.";
    $('[data-pour="d"]', panneau).textContent = champD.value.length + " car.";
    $('[data-pour="t"]', panneau).classList.toggle("trop", champT.value.length > 62);
    $('[data-pour="d"]', panneau).classList.toggle("trop", champD.value.length > 160);
  }
  majApercu();
  [champT, champD].forEach(function (c) { c.addEventListener("input", function () { majApercu(); marquer(); }); });
  $(".ed-google", barre).addEventListener("click", function () { panneau.hidden = !panneau.hidden; });
  $(".ed-fermer", panneau).addEventListener("click", function () { panneau.hidden = true; });

  // Liste des pages
  var choix = $(".ed-pages select", barre);
  fetch("/__edition/pages").then(function (r) { return r.json(); }).then(function (pages) {
    pages.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.url; o.textContent = p.titre;
      if (p.url === location.pathname) o.selected = true;
      choix.appendChild(o);
    });
  });
  choix.addEventListener("change", function () {
    if (modifie && !confirm("Vous avez des modifications non enregistrées sur cette page. Les abandonner ?")) { choix.value = location.pathname; return; }
    modifie = false;
    location.href = choix.value + "?edition";
  });

  $(".ed-annuler", barre).addEventListener("click", function () {
    if (!modifie || confirm("Annuler toutes les modifications non enregistrées de cette page ?")) { modifie = false; location.reload(); }
  });

  var etat = $(".ed-etat", barre);
  function marquer() {
    if (modifie) return;
    modifie = true;
    barre.classList.add("ed-modifie");
    etat.textContent = "Modifications non enregistrées";
  }
  window.addEventListener("beforeunload", function (e) { if (modifie) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Enregistrement ---------- */
  function htmlPropre() {
    // Titre et description Google
    titre.textContent = champT.value.trim();
    if (desc) desc.setAttribute("content", champD.value.trim());
    var og = $('meta[property="og:description"]'); if (og && desc) og.setAttribute("content", champD.value.trim());

    var copie = document.documentElement.cloneNode(true);
    $$("[data-edition-injecte]", copie).forEach(function (n) { n.remove(); });
    $$("[contenteditable]", copie).forEach(function (n) { n.removeAttribute("contenteditable"); n.removeAttribute("spellcheck"); });
    $$("[data-edition-ouvert]", copie).forEach(function (n) { n.removeAttribute("open"); n.removeAttribute("data-edition-ouvert"); });
    $$("[data-edition-cache]", copie).forEach(function (n) { n.setAttribute("hidden", ""); n.removeAttribute("data-edition-cache"); });
    var corps = copie.querySelector("body");
    corps.classList.remove("edition-actif");
    if (!corps.getAttribute("class")) corps.removeAttribute("class");
    return "<!doctype html>\n" + copie.outerHTML + "\n";
  }

  var btn = $(".ed-enregistrer", barre);
  btn.addEventListener("click", function () {
    btn.disabled = true; btn.textContent = "Enregistrement…";
    fetch("/__edition/enregistrer", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: location.pathname, html: htmlPropre() })
    }).then(function (r) { return r.json(); }).then(function (rep) {
      if (!rep.ok) throw new Error(rep.erreur);
      modifie = false;
      barre.classList.remove("ed-modifie");
      etat.textContent = "✔ Enregistré à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      btn.textContent = "Enregistré ✔";
      setTimeout(function () { btn.textContent = "Enregistrer"; btn.disabled = false; }, 1600);
    }).catch(function (e) {
      alert("L'enregistrement a échoué : " + e.message + "\nVérifiez que la fenêtre noire « Modifier le site » est toujours ouverte.");
      btn.textContent = "Enregistrer"; btn.disabled = false;
    });
  });
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); btn.click(); }
  });
})();
