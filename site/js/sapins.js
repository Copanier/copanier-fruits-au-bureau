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

  function essayer(code, boite) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: octets(boite.s), iterations: donnees.iterations, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    }).then(function (cle) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: octets(boite.i) }, cle, octets(boite.d));
    }).then(function (clair) { return JSON.parse(new TextDecoder().decode(clair)); }, function () { return null; });
  }

  function ouvrir(code) {
    code = normaliser(code);
    if (code.length < 4) { message.textContent = "Saisissez le code complet communiqué par votre entreprise."; return; }
    if (!window.crypto || !crypto.subtle) { message.textContent = "Votre navigateur est trop ancien pour commander. Essayez avec un navigateur à jour."; return; }
    bouton.disabled = true;
    message.textContent = "Vérification du code…";
    var essais = donnees.coffre.map(function (b) { return essayer(code, b); });
    Promise.all(essais).then(function (res) {
      var info = res.filter(Boolean)[0];
      bouton.disabled = false;
      if (!info) { message.textContent = "Ce code n'est pas reconnu. Vérifiez-le ou demandez-le à votre entreprise."; return; }
      message.textContent = "";
      try { sessionStorage.setItem("copanier-code-sapins", code); } catch (e) {}
      afficher(info);
    });
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
      '<p class="petit sapins__note">Vous serez redirigé vers la page de paiement sécurisée de Stripe. Votre nom, votre e-mail, votre téléphone et votre service ou étage vous y seront demandés pour la livraison.</p>';
    boutique.innerHTML = html;
    boutique.hidden = false;
    demarrerRebours();
    boutique.querySelectorAll("[data-lien]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var choix = boutique.querySelector('input[name="vague"]:checked:not(:disabled)');
        var v = choix && info.vagues.filter(function (x) { return x.id === choix.value; })[0];
        if (!v || new Date(v.fin).getTime() <= Date.now()) { alert("Choisissez une date de livraison encore ouverte."); return; }
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
  var m = location.hash.match(/code=([A-Za-z0-9-]+)/);
  var memo = null;
  try { memo = sessionStorage.getItem("copanier-code-sapins"); } catch (e) {}
  if (m || memo) { champ.value = m ? m[1].toUpperCase() : memo; ouvrir(champ.value); }
})();
