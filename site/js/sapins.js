/* Vente de sapins : le code entreprise déchiffre les informations de l'entreprise
   (nom, dates, tailles, prix, liens de paiement Stripe). Sans le bon code, rien n'est lisible. */
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
      try { sessionStorage.setItem("copanier-code-sapins", code); } catch (e) {}
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
      '<p class="boissons__intro"><strong>' + echapper(b.producteur) + "</strong> – " + echapper(b.presentation) + " Livré avec les sapins, à la même date, dans votre entreprise.</p>" +
      '<label class="sapins__accord boissons__majeur"><input type="checkbox" data-majeur> <span>Je certifie avoir <strong>18&nbsp;ans révolus</strong>. La vente d\'alcool est interdite aux mineurs.</span></label>' +
      categories.map(function (c) {
        return '<p class="boissons__categorie">' + echapper(c) + '</p><div class="boissons__liste">' +
          b.produits.filter(function (p) { return p.categorie === c; }).map(function (p) {
            return '<div class="boisson">' +
              '<img src="' + echapper(p.image) + '" alt="' + echapper(b.producteur + " – " + p.nom) + '" width="' + (p.l || 170) + '" height="' + (p.h || 640) + '" loading="lazy">' +
              '<p class="boisson__nom">' + echapper(p.nom) + "</p>" +
              (p.detail ? '<p class="boisson__detail">' + echapper(p.detail) + "</p>" : "") +
              (p.contenance ? '<p class="boisson__detail">' + echapper(p.contenance) + "</p>" : "") +
              (p.prix ? '<p class="sapin__prix">' + String(p.prix).replace(".", ",") + "&nbsp;€ <small>TTC</small></p>" : '<p class="boisson__bientot">Prix bientôt disponible</p>') +
              (p.prix && p.lien ? '<a class="bouton bouton--petit" data-alcool data-lien="' + echapper(p.lien) + '" href="#">Commander</a>' : "") +
              "</div>";
          }).join("") + "</div>";
      }).join("") +
      '<p class="mention-alcool">L\'abus d\'alcool est dangereux pour la santé, à consommer avec modération.</p>' +
      "</section>";
  }

  function afficher(info) {
    var maintenant = Date.now();
    var ouvertes = info.vagues.filter(function (v) { return new Date(v.fin).getTime() > maintenant; });
    var html = '<div class="sapins__entreprise"><p>Bienvenue aux collaborateurs de <strong>' + echapper(info.entreprise) + "</strong>&nbsp;!</p>" +
      (info.adresse ? '<p class="sapins__adresse">🚚 Livré dans votre entreprise&nbsp;: <strong>' + echapper(info.adresse) + "</strong></p>" : "") + "</div>";
    if (!ouvertes.length) {
      boutique.innerHTML = html + '<p class="sapins__clos">Les commandes de sapins sont closes pour cette année. Merci et à l\'année prochaine&nbsp;!</p>';
      boutique.hidden = false;
      return;
    }
    // Toutes les dates sont affichées ; celles dont la date limite est passée sont grisées et non sélectionnables
    var premiere = info.vagues.indexOf(ouvertes[0]);
    html += '<fieldset class="sapins__dates"><legend>1. Votre date de livraison au bureau</legend>' +
      info.vagues.map(function (v, i) {
        var fin = new Date(v.fin).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
        var close = new Date(v.fin).getTime() <= maintenant;
        return '<label class="sapins__date' + (close ? " est-close" : "") + '"><input type="radio" name="vague" value="' + echapper(v.id) + '"' +
          (i === premiere ? " checked" : "") + (close ? " disabled" : "") + "> <span><strong>Livraison le " + echapper(v.livraison) + "</strong>" +
          "<small>Commandes jusqu'au " + fin + " à minuit</small>" +
          '<span class="sapins__rebours" data-fin="' + echapper(v.fin) + '">' + (close ? "Commandes closes" : "") + "</span></span></label>";
      }).join("") + "</fieldset>" +
      '<p class="sapins__etape">2. Votre sapin Nordmann</p><div class="sapins__liste">' +
      info.sapins.map(function (s, i) {
        var h = 70 + i * 14;
        return '<div class="sapin">' +
          '<svg class="sapin__dessin" viewBox="0 0 60 100" style="height:' + h + 'px" aria-hidden="true"><path d="M30 4 L52 40 H40 L56 66 H42 L58 88 H2 L18 66 H4 L20 40 H8 Z" fill="#2f6b4a"/><rect x="26" y="88" width="8" height="10" fill="#8a5a3c"/><circle cx="30" cy="5" r="3" fill="#f4661c"/></svg>' +
          '<p class="sapin__taille">' + echapper(s.taille) + "</p>" +
          '<p class="sapin__pour">' + echapper(s.pour || "") + "</p>" +
          '<p class="sapin__prix">' + s.prix + "&nbsp;€ <small>TTC</small></p>" +
          (s.lien ? '<a class="bouton bouton--petit" data-lien="' + echapper(s.lien) + '" href="#">Commander</a>'
                  : '<span class="sapin__bientot">Bientôt disponible</span>') +
          "</div>";
      }).join("") + "</div>" +
      boissonsHtml(info.boissons) +
      // Récapitulatif de livraison, mis à jour selon la date choisie
      '<div class="sapins__recap" aria-live="polite"></div>' +
      '<label class="sapins__accord"><input type="checkbox" data-accord> <span>J\'ai bien noté que ma commande sera <strong>livrée dans mon entreprise à la date choisie</strong>, que je la récupère sur place, et j\'accepte les <a href="/conditions-generales-de-vente/" target="_blank">conditions générales de vente</a>.</span></label>' +
      '<p class="petit sapins__note">En cliquant sur «&nbsp;Commander&nbsp;», vous êtes redirigé vers la page de paiement sécurisée de Stripe, où vous indiquerez <strong>votre prénom et votre nom</strong> (inscrits sur l\'étiquette de votre commande), votre e-mail, votre téléphone et votre service ou étage.</p>';
    boutique.innerHTML = html;
    boutique.hidden = false;
    function majRecap() {
      var choix = boutique.querySelector('input[name="vague"]:checked:not(:disabled)');
      var v = choix && info.vagues.filter(function (x) { return x.id === choix.value; })[0];
      boutique.querySelector(".sapins__recap").innerHTML = '<p class="sapins__recap-titre">📦 Votre livraison</p><ul>' +
        "<li>Entreprise&nbsp;: <strong>" + echapper(info.entreprise) + "</strong></li>" +
        (info.adresse ? "<li>Adresse de livraison&nbsp;: <strong>" + echapper(info.adresse) + "</strong></li>" : "") +
        "<li>Date de livraison&nbsp;: <strong>" + (v ? echapper(v.livraison) : "choisissez une date ci-dessus") + "</strong></li>" +
        "<li>🏷️ <strong>Votre prénom et votre nom figureront sur l'étiquette de votre commande</strong> pour que vous la retrouviez facilement le jour de la livraison.</li></ul>";
    }
    // Récapitulatif et accord placés entre le choix de la date et le choix du sapin
    var etape = boutique.querySelector(".sapins__etape");
    etape.parentNode.insertBefore(boutique.querySelector(".sapins__recap"), etape);
    etape.parentNode.insertBefore(boutique.querySelector(".sapins__accord"), etape);
    boutique.querySelectorAll('input[name="vague"]').forEach(function (r) { r.addEventListener("change", majRecap); });
    boutique.majRecap = majRecap;
    majRecap();
    demarrerRebours();
    boutique.querySelectorAll("[data-lien]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var choix = boutique.querySelector('input[name="vague"]:checked:not(:disabled)');
        var v = choix && info.vagues.filter(function (x) { return x.id === choix.value; })[0];
        if (!v || new Date(v.fin).getTime() <= Date.now()) { alert("Choisissez une date de livraison encore ouverte."); return; }
        var accord = boutique.querySelector("[data-accord]");
        if (!accord.checked) {
          accord.closest("label").classList.add("a-cocher");
          accord.closest("label").scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        // Boissons alcoolisées : déclaration de majorité obligatoire
        var majeur = boutique.querySelector("[data-majeur]");
        if (a.hasAttribute("data-alcool") && majeur && !majeur.checked) {
          majeur.closest("label").classList.add("a-cocher");
          majeur.closest("label").scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        var vague = v.id;
        // Référence transmise à Stripe : code entreprise + livraison choisie (ex. ENTRE7K2Q-V1)
        var ref = (info.reference + "-" + vague).replace(/[^A-Za-z0-9_-]/g, "");
        var url = a.getAttribute("data-lien");
        location.href = url + (url.indexOf("?") < 0 ? "?" : "&") + "client_reference_id=" + encodeURIComponent(ref);
      });
    });
    boutique.scrollIntoView({ behavior: "smooth", block: "start" });
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
        boutique.querySelectorAll("[data-lien]").forEach(function (a) { a.replaceWith(Object.assign(document.createElement("span"), { className: "sapin__bientot", textContent: "Commandes closes" })); });
      }
    }
    maj();
    minuterie = setInterval(maj, 1000);
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); ouvrir(champ.value); });

  // Lien direct envoyé aux entreprises : /sapins-de-noel/#code=XXXX (le code ne quitte jamais votre navigateur)
  var m = location.hash.match(/code=([0-9A-Za-z-]+)/);
  var memo = null;
  try { memo = sessionStorage.getItem("copanier-code-sapins"); } catch (e) {}
  if (m || memo) { champ.value = m ? m[1].toUpperCase() : memo; ouvrir(champ.value); }
})();
