/* Vente de sapins : le code entreprise déchiffre les informations de l'entreprise
   (nom, adresse, dates, articles, prix). Sans le bon code, rien n'est lisible.
   Le panier est payé en une fois : la fonction « copanier-boutique » vérifie le code et les prix
   côté serveur puis crée la page de paiement Stripe. */
(function () {
  "use strict";
  var form = document.querySelector("[data-sapins-code]");
  var boutique = document.querySelector("[data-sapins-boutique]");
  var source = document.getElementById("sapins-donnees");
  if (!form || !boutique || !source) return;
  var donnees = JSON.parse(source.textContent);
  var champ = form.querySelector("input");
  var message = form.querySelector(".sapins__message");
  var bouton = form.querySelector("button");

  function normaliser(c) { return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function echapper(t) { return String(t).replace(/[&<>"]/g, function (x) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]; }); }
  function octets(b64) { var s = atob(b64), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }

  // La clé est calculée une seule fois à partir du code, puis essayée sur chaque entreprise
  function cleDuCode(code) {
    return crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: octets(donnees.sel), iterations: donnees.iterations, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    });
  }
  function essayer(cle, boite) {
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: octets(boite.i) }, cle, octets(boite.d))
      .then(function (clair) { return JSON.parse(new TextDecoder().decode(clair)); }, function () { return null; });
  }

  function ouvrir(code) {
    code = normaliser(code);
    if (code.length < 4) { message.textContent = "Saisissez le code complet communiqué par votre entreprise."; return; }
    if (!window.crypto || !crypto.subtle) { message.textContent = "Votre navigateur est trop ancien pour commander. Essayez avec un navigateur à jour."; return; }
    bouton.disabled = true;
    message.textContent = "Vérification du code…";
    cleDuCode(code).then(function (cle) {
      return Promise.all(donnees.coffre.map(function (b) { return essayer(cle, b); }));
    }).then(function (res) {
      var info = res.filter(Boolean)[0];
      bouton.disabled = false;
      if (!info) { message.textContent = "Ce code n'est pas reconnu. Vérifiez-le auprès de votre responsable, qui l'a reçu par e-mail."; return; }
      message.textContent = "";
      try { localStorage.setItem("copanier-code-sapins", code); } catch (e) {}
      afficher(info);
    });
  }

  // Champagne et boissons du producteur, livrés avec les sapins
  function boissonsHtml(b) {
    if (!b || !b.produits || !b.produits.length) return "";
    var categories = [];
    b.produits.forEach(function (p) { if (categories.indexOf(p.categorie) < 0) categories.push(p.categorie); });
    return '<section class="boissons" aria-labelledby="boissons-titre">' +
      '<p class="sapins__etape" id="boissons-titre">🥂 Et pour les fêtes&nbsp;: le champagne en direct du producteur</p>' +
      '<p class="boissons__intro"><strong>' + echapper(b.producteur) + "</strong> – " + echapper(b.presentation) + "</p>" +
      '<p class="boissons__date" data-date-boissons></p>' +
      '<p class="boissons__tva">Prix TTC, TVA à ' + echapper(b.tva || "20 %") + ' incluse. Livraison au bureau incluse.</p>' +
      '<label class="sapins__accord boissons__majeur"><input type="checkbox" data-majeur> <span>Je certifie avoir <strong>18&nbsp;ans révolus</strong>. La vente d\'alcool est interdite aux mineurs.</span></label>' +
      categories.map(function (c) {
        return '<p class="boissons__categorie">' + echapper(c) + '</p><div class="boissons__liste">' +
          b.produits.filter(function (p) { return p.categorie === c; }).map(function (p) {
            return '<div class="boisson' + (p.coeur ? " boisson--coeur" : "") + '">' +
              (p.coeur ? '<span class="boisson__coeur">❤️ Coup de cœur CoPanier</span>' : "") +
              '<img src="' + echapper(p.image) + '" alt="' + echapper(b.producteur + " – " + p.nom) + '" width="' + (p.l || 170) + '" height="' + (p.h || 640) + '" loading="lazy">' +
              '<p class="boisson__nom">' + echapper(p.nom) + "</p>" +
              (p.detail ? '<p class="boisson__detail">' + echapper(p.detail) + "</p>" : "") +
              (p.contenance ? '<p class="boisson__detail">' + echapper(p.contenance) + "</p>" : "") +
              (p.fiche ? '<button type="button" class="boisson__plus" data-fiche="' + b.produits.indexOf(p) + '">En savoir plus</button>' : "") +
              (p.prix ? '<p class="sapin__prix">' + Number(p.prix).toFixed(2).replace(".", ",") + "&nbsp;€ <small>TTC</small></p>" : '<p class="boisson__bientot">Prix bientôt disponible</p>') +
              (p.prix ? quantiteHtml(p.id, "boisson") : "") +
              "</div>";
          }).join("") + "</div>";
      }).join("") +
      '<p class="mention-alcool">L\'abus d\'alcool est dangereux pour la santé, à consommer avec modération.</p>' +
      "</section>";
  }

  // Fenêtre « En savoir plus » d'une boisson
  function ouvrirFiche(b, p) {
    var f = p.fiche || {};
    var d = document.getElementById("fiche-boisson");
    if (!d) {
      d = document.createElement("dialog");
      d.id = "fiche-boisson";
      d.className = "fiche-boisson";
      document.body.appendChild(d);
      d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-fermer-fiche]")) d.close(); });
    }
    d.innerHTML = '<button type="button" class="fiche-boisson__fermer" data-fermer-fiche aria-label="Fermer">&times;</button>' +
      '<div class="fiche-boisson__corps">' +
      '<img src="' + echapper(p.image) + '" alt="" width="' + (p.l || 170) + '" height="' + (p.h || 640) + '">' +
      "<div>" +
      '<p class="fiche-boisson__maison">' + echapper(b.producteur) + " · " + echapper(p.categorie) + "</p>" +
      '<h3 class="fiche-boisson__nom">' + echapper(p.nom) + "</h3>" +
      (p.coeur ? '<p class="fiche-boisson__coeur">❤️ Coup de cœur CoPanier</p>' : "") +
      (f.cepage ? "<p><strong>Cépage</strong>&nbsp;: " + echapper(f.cepage) + "</p>" : "") +
      (f.caracteristiques && f.caracteristiques.length ? "<ul>" + f.caracteristiques.map(function (c) { return "<li>" + echapper(c) + "</li>"; }).join("") + "</ul>" : "") +
      (f.degustation ? "<p><strong>Dégustation</strong>&nbsp;: " + echapper(f.degustation) + "</p>" : "") +
      (f.accords ? "<p><strong>Accords</strong>&nbsp;: " + echapper(f.accords) + "</p>" : "") +
      (f.a_completer ? '<p class="petit">Fiche détaillée bientôt disponible. Une question&nbsp;? <a href="mailto:contact@copanier.fr">contact@copanier.fr</a></p>' : "") +
      (p.prix ? '<p class="sapin__prix">' + Number(p.prix).toFixed(2).replace(".", ",") + "&nbsp;€ <small>TTC</small></p>" : "") +
      '<p class="mention-alcool">L\'abus d\'alcool est dangereux pour la santé, à consommer avec modération.</p>' +
      "</div></div>";
    d.showModal();
  }

  function afficher(info) {
    var maintenant = Date.now();
    var ouvertes = info.vagues.filter(function (v) { return new Date(v.fin).getTime() > maintenant; });
    var html = '<div class="sapins__entreprise"><p>Bienvenue aux collaborateurs de <strong>' + echapper(info.entreprise) + "</strong>&nbsp;! " +
      '<button type="button" class="sapins__changer" data-changer-code>Changer d\'entreprise</button></p>' +
      (info.adresse ? '<p class="sapins__adresse">🚚 Livré dans votre entreprise&nbsp;: <strong>' + echapper(info.adresse) + "</strong></p>" : "") + "</div>";
    if (!ouvertes.length) {
      boutique.innerHTML = html + '<p class="sapins__clos">Les commandes de sapins sont closes pour cette année. Merci et à l\'année prochaine&nbsp;!</p>';
      boutique.hidden = false;
      return;
    }
    // Toutes les dates sont affichées ; celles dont la date limite est passée sont grisées et non sélectionnables
    var premiere = info.vagues.indexOf(ouvertes[0]);
    html += '<fieldset class="sapins__dates"><legend>1. Votre date de livraison au bureau <small>(sapins et champagne livrés ensemble)</small></legend>' +
      info.vagues.map(function (v, i) {
        var fin = new Date(v.fin).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
        var close = new Date(v.fin).getTime() <= maintenant;
        return '<label class="sapins__date' + (close ? " est-close" : "") + '"><input type="radio" name="vague" value="' + echapper(v.id) + '"' +
          (i === premiere ? " checked" : "") + (close ? " disabled" : "") + "> <span><strong>Livraison le " + echapper(v.livraison) + "</strong>" +
          "<small>Commandes jusqu'au " + fin + " à minuit</small>" +
          '<span class="sapins__rebours" data-fin="' + echapper(v.fin) + '">' + (close ? "Commandes closes" : "") + "</span></span></label>";
      }).join("") + "</fieldset>" +
      '<p class="sapins__etape">2. Votre sapin Nordmann, livré avec son pied</p><div class="sapins__liste">' +
      info.sapins.map(function (s, i) {
        var h = 70 + i * 14;
        return '<div class="sapin">' +
          '<svg class="sapin__dessin" viewBox="0 0 60 100" style="height:' + h + 'px;margin-top:' + (126 - h) + 'px" aria-hidden="true"><path d="M30 4 L52 40 H40 L56 66 H42 L58 88 H2 L18 66 H4 L20 40 H8 Z" fill="#2f6b4a"/><rect x="26" y="88" width="8" height="10" fill="#8a5a3c"/><circle cx="30" cy="5" r="3" fill="#f4661c"/></svg>' +
          '<p class="sapin__taille">' + echapper(s.taille) + "</p>" +
          '<p class="sapin__pour">' + echapper(s.pour || "") + "</p>" +
          '<p class="sapin__pied">🪵 Pied bûche inclus</p>' +
          '<p class="sapin__prix" data-prix="' + s.prix + '">' + s.prix + "&nbsp;€ <small>TTC</small></p>" +
          (info.sans_pied ? '<label class="sapin__sanspied"><input type="checkbox" data-sans-pied> Je ne souhaite pas de pied (−' + info.sans_pied.remise + "&nbsp;€)</label>" : "") +
          quantiteHtml(s.id, "sapin") +
          "</div>";
      }).join("") + "</div>" +
      boissonsHtml(info.boissons) +
      // Récapitulatif de livraison, mis à jour selon la date choisie
      '<div class="sapins__recap" aria-live="polite"></div>' +
      '<label class="sapins__accord"><input type="checkbox" data-accord> <span>J\'ai bien noté que ma commande sera <strong>livrée dans mon entreprise à la date choisie</strong>, que je la récupère sur place, et j\'accepte les <a href="/conditions-generales-de-vente/" target="_blank">conditions générales de vente</a>.</span></label>' +
      '<section class="panier" data-panier aria-labelledby="panier-titre">' +
        '<p class="sapins__etape" id="panier-titre">🧺 Votre commande</p>' +
        '<p class="panier__date" data-panier-date></p>' +
        '<div class="panier__contenu" aria-live="polite"></div>' +
        '<button type="button" class="bouton bouton--grand panier__payer" data-payer>Valider et payer</button>' +
        '<p class="petit sapins__note">Vous serez redirigé vers la page de paiement sécurisée de Stripe, où vous indiquerez <strong>votre prénom et votre nom</strong> (inscrits sur l\'étiquette de votre commande), votre e-mail, votre téléphone et votre service ou étage.</p>' +
      "</section>" +
      '<div class="panier-barre" data-panier-barre hidden><span class="panier-barre__total"></span><button type="button" class="bouton bouton--petit" data-voir-panier>Voir ma commande</button></div>';
    boutique.innerHTML = html;
    boutique.hidden = false;
    function majRecap() {
      var choix = boutique.querySelector('input[name="vague"]:checked:not(:disabled)');
      var v = choix && info.vagues.filter(function (x) { return x.id === choix.value; })[0];
      boutique.querySelector(".sapins__recap").innerHTML = '<p class="sapins__recap-titre">📦 Votre livraison</p><ul>' +
        "<li>Entreprise&nbsp;: <strong>" + echapper(info.entreprise) + "</strong></li>" +
        (info.adresse ? "<li>Adresse de livraison&nbsp;: <strong>" + echapper(info.adresse) + "</strong></li>" : "") +
        "<li>Date de livraison&nbsp;: <strong>" + (v ? echapper(v.livraison) : "choisissez une date ci-dessus") + "</strong> – sapins et bouteilles sont livrés ensemble, le même jour</li>" +
        "<li>🏷️ <strong>Votre prénom et votre nom figureront sur l'étiquette de votre commande</strong> pour que vous la retrouviez facilement le jour de la livraison.</li></ul>";
      // La date choisie s'applique à toute la commande : on la rappelle au champagne et dans le panier
      var dateTxt = v ? "<strong>" + echapper(v.livraison) + "</strong>" : "<strong>la date choisie en haut de page</strong>";
      var db = boutique.querySelector("[data-date-boissons]");
      if (db) db.innerHTML = "📅 Livré <strong>en même temps que votre sapin</strong>, le " + dateTxt + ", dans votre entreprise. <a href=\"#\" data-vers-dates>Changer la date</a>";
      var dp = boutique.querySelector("[data-panier-date]");
      if (dp) dp.innerHTML = "📅 Livraison de toute la commande (sapins et bouteilles) le " + dateTxt;
    }
    // Récapitulatif et accord placés entre le choix de la date et le choix du sapin
    var etape = boutique.querySelector(".sapins__etape");
    etape.parentNode.insertBefore(boutique.querySelector(".sapins__recap"), etape);
    etape.parentNode.insertBefore(boutique.querySelector("[data-accord]").closest("label"), etape);
    boutique.querySelectorAll('input[name="vague"]').forEach(function (r) { r.addEventListener("change", majRecap); });
    boutique.majRecap = majRecap;
    boutique.addEventListener("click", function (e) {
      if (!e.target.closest("[data-vers-dates]")) return;
      e.preventDefault();
      boutique.querySelector(".sapins__dates").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    majRecap();
    demarrerRebours();
    // Code mémorisé sur cet appareil : ce bouton l'efface pour en saisir un autre
    boutique.querySelector("[data-changer-code]").addEventListener("click", function () {
      try { localStorage.removeItem("copanier-code-sapins"); } catch (e) {}
      boutique.hidden = true; boutique.innerHTML = ""; champ.value = ""; message.textContent = "";
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      champ.focus();
    });
    boutique.querySelectorAll("[data-sans-pied]").forEach(function (c) {
      c.addEventListener("change", function () {
        var prix = c.closest(".sapin").querySelector(".sapin__prix");
        var base = Number(prix.getAttribute("data-prix")), remise = info.sans_pied.remise;
        prix.innerHTML = c.checked ? '<s>' + base + "&nbsp;€</s> " + (base - remise) + "&nbsp;€ <small>TTC</small>" : base + "&nbsp;€ <small>TTC</small>";
      });
    });
    boutique.querySelectorAll("[data-fiche]").forEach(function (bt) {
      bt.addEventListener("click", function () { ouvrirFiche(info.boissons, info.boissons.produits[Number(bt.getAttribute("data-fiche"))]); });
    });
    // ===== Panier =====
    var panier = {}; // id -> { quantite, sansPied }
    var articles = {};
    info.sapins.forEach(function (x) { articles[x.id] = { nom: "Sapin Nordmann " + x.taille, prix: x.prix, type: "sapin" }; });
    ((info.boissons && info.boissons.produits) || []).forEach(function (x) { if (x.prix) articles[x.id] = { nom: x.nom, prix: x.prix, type: "boisson" }; });
    function prixUnitaire(id) {
      var a = articles[id], l = panier[id];
      return a.prix - (a.type === "sapin" && l && l.sansPied && info.sans_pied ? info.sans_pied.remise : 0);
    }
    function euros(n) { return n.toFixed(2).replace(".", ",") + "&nbsp;€"; }
    function majPanier() {
      var lignes = Object.keys(panier).filter(function (id) { return panier[id].quantite > 0; });
      var total = 0, nb = 0;
      var html = lignes.map(function (id) {
        var l = panier[id], a = articles[id], pu = prixUnitaire(id);
        total += pu * l.quantite; nb += l.quantite;
        return "<li><span>" + l.quantite + " × " + echapper(a.nom) + (a.type === "sapin" ? (l.sansPied ? " <small>(sans pied)</small>" : " <small>(avec pied)</small>") : "") +
          "</span><strong>" + euros(pu * l.quantite) + "</strong></li>";
      }).join("");
      boutique.querySelector(".panier__contenu").innerHTML = lignes.length
        ? '<ul class="panier__lignes">' + html + '</ul><p class="panier__total">Total TTC <strong>' + euros(total) + "</strong></p>"
        : '<p class="panier__vide">Votre commande est vide&nbsp;: ajoutez un sapin ou une bouteille avec le bouton «&nbsp;+&nbsp;».</p>';
      boutique.querySelectorAll(".quantite").forEach(function (q) {
        var n = (panier[q.getAttribute("data-article")] || {}).quantite || 0;
        q.querySelector("output").textContent = n;
        q.querySelector("[data-moins]").disabled = n === 0;
        q.closest(".sapin, .boisson").classList.toggle("est-choisi", n > 0);
      });
      var barre = boutique.querySelector("[data-panier-barre]");
      barre.hidden = !nb;
      barre.querySelector(".panier-barre__total").innerHTML = "🧺 " + nb + " article" + (nb > 1 ? "s" : "") + " · <strong>" + euros(total) + "</strong>";
      boutique.querySelector("[data-payer]").classList.toggle("est-bloque", !nb || !boutique.querySelector("[data-accord]").checked);
    }
    function verifierCases(type) {
      var accord = boutique.querySelector("[data-accord]");
      if (!accord.checked) { exiger(accord, "Pour commander, cochez d'abord cette case : elle confirme que votre commande sera livrée dans votre entreprise à la date choisie."); return false; }
      var majeur = boutique.querySelector("[data-majeur]");
      if (type === "boisson" && majeur && !majeur.checked) { exiger(majeur, "Pour ajouter une bouteille, cochez d'abord cette case : la vente d'alcool est réservée aux personnes majeures."); return false; }
      return true;
    }
    boutique.querySelectorAll(".quantite").forEach(function (q) {
      var id = q.getAttribute("data-article"), type = q.getAttribute("data-type");
      q.querySelector("[data-plus]").addEventListener("click", function () {
        if (!verifierCases(type)) return;
        var l = panier[id] || (panier[id] = { quantite: 0, sansPied: false });
        if (l.quantite >= 20) return;
        l.quantite++;
        var sp = q.closest(".sapin") && q.closest(".sapin").querySelector("[data-sans-pied]");
        if (sp) l.sansPied = sp.checked;
        majPanier();
      });
      q.querySelector("[data-moins]").addEventListener("click", function () {
        var l = panier[id]; if (!l || !l.quantite) return;
        l.quantite--; majPanier();
      });
    });
    boutique.querySelectorAll("[data-sans-pied]").forEach(function (c) {
      c.addEventListener("change", function () {
        var id = c.closest(".sapin").querySelector(".quantite").getAttribute("data-article");
        if (panier[id]) panier[id].sansPied = c.checked;
        majPanier();
      });
    });
    boutique.querySelector("[data-voir-panier]").addEventListener("click", function () {
      boutique.querySelector("[data-panier]").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    var payer = boutique.querySelector("[data-payer]");
    payer.addEventListener("click", function () {
      var choix = boutique.querySelector('input[name="vague"]:checked:not(:disabled)');
      var v = choix && info.vagues.filter(function (x) { return x.id === choix.value; })[0];
      if (!v || new Date(v.fin).getTime() <= Date.now()) { alertePanier("Choisissez une date de livraison encore ouverte, tout en haut."); return; }
      var lignes = Object.keys(panier).filter(function (id) { return panier[id].quantite > 0; });
      if (!lignes.length) { alertePanier("Ajoutez d'abord un sapin ou une bouteille avec le bouton « + »."); return; }
      if (!verifierCases(lignes.some(function (id) { return articles[id].type === "boisson"; }) ? "boisson" : "sapin")) return;
      payer.disabled = true; payer.textContent = "Préparation du paiement…";
      fetch(donnees.paiement, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: donnees.cle_publique },
        body: JSON.stringify({ action: "paiement", reference: info.reference, vague: v.id,
          articles: lignes.map(function (id) { return { id: id, quantite: panier[id].quantite, sans_pied: !!panier[id].sansPied }; }),
          retour: location.origin + location.pathname })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.url) throw new Error(j.erreur || "indisponible"); return j; });
      }).then(function (j) { location.href = j.url; })
        .catch(function (e) {
          payer.disabled = false; payer.textContent = "Valider et payer";
          alertePanier(/indisponible|Failed|NetworkError|non configur/i.test(e.message) ? "Le paiement en ligne ouvre très bientôt. Merci de votre patience !" : e.message);
        });
    });
    function alertePanier(texte) {
      var zone = boutique.querySelector("[data-panier]"), m = zone.querySelector(".sapins__alerte");
      if (!m) { m = document.createElement("p"); m.className = "sapins__alerte"; m.setAttribute("role", "alert"); payer.parentNode.insertBefore(m, payer); }
      m.textContent = texte;
      zone.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    boutique.querySelectorAll("[data-accord], [data-majeur]").forEach(function (c) {
      c.addEventListener("change", function () {
        if (c.checked) { var l = c.closest("label"); l.classList.remove("a-cocher"); var m = l.nextElementSibling; if (m && m.classList.contains("sapins__alerte")) m.remove(); }
        majPanier();
      });
    });
    majPanier();
    // Retour de Stripe : paiement réussi ou abandonné
    if (/paiement=ok/.test(location.search)) alertePanier("✅ Merci ! Votre paiement est confirmé. Vous allez recevoir votre reçu par e-mail.");
    else if (/paiement=annule/.test(location.search)) alertePanier("Paiement annulé : votre commande n'a pas été enregistrée. Vous pouvez la refaire ci-dessous.");
    boutique.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Sélecteur de quantité − 0 +
  function quantiteHtml(id, type) {
    return '<div class="quantite" data-article="' + echapper(id) + '" data-type="' + type + '">' +
      '<button type="button" data-moins aria-label="Retirer un article">−</button>' +
      '<output aria-live="polite">0</output>' +
      '<button type="button" data-plus aria-label="Ajouter un article">+</button></div>';
  }

  // Met en évidence une case à cocher obligatoire, avec un message, et fait défiler la page jusqu'à elle
  function exiger(caseACocher, texte) {
    var label = caseACocher.closest("label");
    label.classList.remove("a-cocher"); void label.offsetWidth; label.classList.add("a-cocher");
    var m = label.nextElementSibling;
    if (!m || !m.classList.contains("sapins__alerte")) {
      m = document.createElement("p");
      m.className = "sapins__alerte";
      m.setAttribute("role", "alert");
      label.parentNode.insertBefore(m, label.nextSibling);
    }
    m.textContent = "☝️ " + texte;
    label.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(function () { caseACocher.focus({ preventScroll: true }); }, 400);
  }

  // Compte à rebours de chaque date limite, mis à jour chaque seconde. À zéro, la date devient impossible à choisir.
  var minuterie = null;
  function deux(n) { return (n < 10 ? "0" : "") + n; }
  function demarrerRebours() {
    clearInterval(minuterie);
    function maj() {
      var maintenant = Date.now(), ouvertes = 0;
      boutique.querySelectorAll(".sapins__rebours").forEach(function (el) {
        var reste = new Date(el.getAttribute("data-fin")).getTime() - maintenant;
        var label = el.closest("label"), radio = label.querySelector("input");
        if (reste <= 0) {
          if (!radio.disabled) {
            radio.disabled = true; radio.checked = false; label.classList.add("est-close");
            var autre = boutique.querySelector('input[name="vague"]:not(:disabled)');
            if (autre && !boutique.querySelector('input[name="vague"]:checked')) autre.checked = true;
            if (boutique.majRecap) boutique.majRecap();
          }
          el.textContent = "Commandes closes";
          return;
        }
        ouvertes++;
        var s = Math.floor(reste / 1000), j = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
        el.innerHTML = "⏳ Plus que <b>" + (j ? j + "&nbsp;j " : "") + deux(h) + "&nbsp;h " + deux(m) + "&nbsp;min " + deux(s % 60) + "&nbsp;s</b>";
      });
      if (!ouvertes) {
        clearInterval(minuterie);
        boutique.querySelectorAll(".quantite, [data-payer]").forEach(function (a) { a.replaceWith(Object.assign(document.createElement("span"), { className: "sapin__bientot", textContent: "Commandes closes" })); });
      }
    }
    maj();
    minuterie = setInterval(maj, 1000);
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); ouvrir(champ.value); });

  // Lien direct envoyé aux entreprises : /sapins-de-noel/#code=XXXX (le code ne quitte jamais votre navigateur)
  var m = location.hash.match(/code=([0-9A-Za-z-]+)/);
  var memo = null;
  try { memo = localStorage.getItem("copanier-code-sapins"); } catch (e) {}
  if (m || memo) { champ.value = m ? m[1].toUpperCase() : memo; ouvrir(champ.value); }
})();
