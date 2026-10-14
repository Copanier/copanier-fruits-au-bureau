/* Jeu « La main à la fraise » : des mains fermées en cercle (vue du dessus), une seule cache la fraise.
   De 2 à 12 joueurs, chacun ouvre une main à son tour. Mode « qui trouve la fraise gagne » ou « … perd ». */
(function () {
  "use strict";
  var racine = document.querySelector("[data-fraise]");
  if (!racine) return;

  var PEAUX = ["#f6d3b8", "#e9b48e", "#d39a6e", "#b57a4f", "#8c5a3a", "#f1c7a1", "#c88a5f", "#6f4530"];
  var CHAMBRE_RATE = [ // mode « gagne » : main vide
    "Raté&nbsp;! Même pas un pépin.",
    "Main vide… comme une salle de pause sans corbeille de fruits.",
    "La fraise vous a vu venir de loin.",
    "Vous avez la main verte&nbsp;? Pas aujourd'hui, visiblement.",
    "Rien. Nada. Que dalle. Même pas un trognon.",
    "C'était pourtant la main qui avait l'air la plus juteuse…",
    "Vous repartez bredouille. Allez, on n'en fait pas tout un fromage… euh, une compote.",
    "Statistiquement, c'était jouable. Pratiquement, non.",
  ];
  var OUF = [ // mode « perd » : main vide
    "Ouf&nbsp;! Vous respirez.",
    "Main vide&nbsp;: vous l'avez échappé belle.",
    "Pas de fraise pour vous. Vous pouvez sourire… pour l'instant.",
    "Sauvé&nbsp;! La pression monte pour les autres.",
    "Rien dans la main, rien dans les poches&nbsp;: tout va bien.",
  ];
  var CHAMBRE_PERDANT = [ // mode « perd » : celui qui trouve la fraise
    "Bravo, vous avez gagné… le droit de payer les croissants&nbsp;!",
    "La fraise vous a choisi. C'est ce qu'on appelle un coup de foudre fruité.",
    "Vous êtes cuit… comme de la confiture.",
    "Tout le monde vous regarde. Et tout le monde rigole.",
    "Avec une telle chance, évitez le loto cette semaine.",
    "Vous ramenez la fraise&nbsp;! Littéralement.",
  ];
  var CHAMBRE_AUTRES = [ // mode « gagne » : ceux qui n'ont pas trouvé
    "repartent les mains vides. Et les poches aussi.",
    "peuvent toujours se consoler avec une pomme.",
    "ont tout tenté. Le hasard, lui, a choisi son camp.",
    "retentent leur chance&nbsp;? Ou ils boudent&nbsp;?",
  ];

  function hasard(t) { return t[Math.floor(Math.random() * t.length)]; }
  function echapper(t) { return String(t).replace(/[&<>"]/g, function (x) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]; }); }
  function pourcent(k) { var p = 100 / k; return (p % 1 ? p.toFixed(1).replace(".", ",") : p) + "&nbsp;%"; }

  // Main vue du dessus, doigts vers le haut (on la tourne ensuite vers le centre du cercle)
  function svgMain(peau, avecFraise) {
    var ombre = "rgba(80,40,20,.28)";
    return '<svg viewBox="0 0 100 130" aria-hidden="true" focusable="false">' +
      // poignet
      '<rect x="36" y="92" width="28" height="38" rx="12" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
      // main fermée : dos de la main, 4 jointures, pouce replié
      '<g class="fraise-main__fermee">' +
        '<ellipse cx="22" cy="74" rx="10" ry="17" transform="rotate(-22 22 74)" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<rect x="22" y="38" width="58" height="62" rx="24" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<circle cx="31" cy="42" r="9.5" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<circle cx="45" cy="38" r="10" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<circle cx="59" cy="38" r="10" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<circle cx="72" cy="43" r="9" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<path d="M36 64 Q50 70 66 64" fill="none" stroke="' + ombre + '" stroke-width="2" stroke-linecap="round"/>' +
      "</g>" +
      // main ouverte : paume, 5 doigts écartés
      '<g class="fraise-main__ouverte">' +
        '<rect x="9" y="50" width="14" height="44" rx="7" transform="rotate(-34 22 92)" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<rect x="22" y="14" width="12" height="50" rx="6" transform="rotate(-10 28 60)" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<rect x="38" y="4" width="12" height="58" rx="6" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<rect x="53" y="8" width="12" height="54" rx="6" transform="rotate(6 59 60)" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<rect x="67" y="22" width="11" height="42" rx="5.5" transform="rotate(16 72 62)" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<rect x="20" y="48" width="60" height="52" rx="22" fill="' + peau + '" stroke="' + ombre + '" stroke-width="2"/>' +
        '<path d="M32 70 Q48 62 66 66 M34 82 Q50 76 64 80" fill="none" stroke="' + ombre + '" stroke-width="1.6" stroke-linecap="round"/>' +
        (avecFraise ?
          '<g class="fraise-main__fraise">' +
            '<path d="M50 58 C36 58 30 70 35 80 C40 90 50 98 50 98 C50 98 60 90 65 80 C70 70 64 58 50 58 Z" fill="#e5383b" stroke="#a4161a" stroke-width="1.5"/>' +
            '<g fill="#ffd166"><ellipse cx="43" cy="69" rx="1.4" ry="2"/><ellipse cx="51" cy="66" rx="1.4" ry="2"/><ellipse cx="58" cy="70" rx="1.4" ry="2"/><ellipse cx="45" cy="79" rx="1.4" ry="2"/><ellipse cx="55" cy="78" rx="1.4" ry="2"/><ellipse cx="50" cy="87" rx="1.4" ry="2"/></g>' +
            '<path d="M50 60 L42 54 L48 56 L50 50 L52 56 L58 54 Z" fill="#2d6a4f" stroke="#1b4332" stroke-width="1"/>' +
          "</g>" : "") +
      "</g>" +
      "</svg>";
  }

  var etat = null;

  /* ───────── Écran de réglage ───────── */
  function reglages(precedents) {
    var n = precedents ? precedents.joueurs.length : 4;
    var mode = precedents ? precedents.mode : "gagne";
    racine.innerHTML =
      '<form class="fraise__reglages">' +
        '<p class="fraise__intro">Une seule main cache la fraise 🍓. Chacun à son tour ouvre une main… Qui va tomber dessus&nbsp;?</p>' +
        '<div class="fraise__ligne"><label for="fraise-nb">Nombre de joueurs</label>' +
          '<select id="fraise-nb">' + Array.from({ length: 11 }, function (_, i) { var v = i + 2; return '<option value="' + v + '"' + (v === n ? " selected" : "") + ">" + v + "</option>"; }).join("") + "</select></div>" +
        '<fieldset class="fraise__modes"><legend>Règle du jeu</legend>' +
          '<label><input type="radio" name="fraise-mode" value="gagne"' + (mode === "gagne" ? " checked" : "") + "> 🏆 Celui qui trouve la fraise <strong>gagne</strong></label>" +
          '<label><input type="radio" name="fraise-mode" value="perd"' + (mode === "perd" ? " checked" : "") + "> 😬 Celui qui trouve la fraise <strong>perd</strong></label>" +
        "</fieldset>" +
        '<div class="fraise__noms"></div>' +
        '<button type="submit" class="bouton">Distribuer les mains</button>' +
      "</form>";
    var select = racine.querySelector("#fraise-nb"), zoneNoms = racine.querySelector(".fraise__noms");
    function champs() {
      var anciens = Array.from(zoneNoms.querySelectorAll("input")).map(function (i) { return i.value; });
      var v = Number(select.value), html = "";
      for (var i = 0; i < v; i++) {
        var val = anciens[i] != null ? anciens[i] : (precedents && precedents.joueurs[i]) || "";
        html += '<input maxlength="16" aria-label="Prénom du joueur ' + (i + 1) + '" placeholder="Joueur ' + (i + 1) + '" value="' + echapper(val) + '">';
      }
      zoneNoms.innerHTML = html;
    }
    champs();
    select.addEventListener("change", champs);
    racine.querySelector("form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var joueurs = Array.from(zoneNoms.querySelectorAll("input")).map(function (inp, i) { return inp.value.trim() || "Joueur " + (i + 1); });
      partie(joueurs, racine.querySelector('input[name="fraise-mode"]:checked').value);
    });
  }

  /* ───────── Partie ───────── */
  function partie(joueurs, mode) {
    var n = joueurs.length;
    etat = {
      joueurs: joueurs, mode: mode, tour: 0, fini: false, verrou: false,
      fraise: Math.floor(Math.random() * n),
      ouvertes: [], historique: [],
      peaux: joueurs.map(function () { return hasard(PEAUX); }),
    };
    var taille = Math.min(19, 150 / n + 4); // largeur d'une main, en % du plateau
    var mains = "";
    for (var i = 0; i < n; i++) {
      var angle = -90 + (360 / n) * i;
      var rad = angle * Math.PI / 180;
      var x = 50 + 37 * Math.cos(rad), y = 50 + 37 * Math.sin(rad);
      mains += '<button type="button" class="fraise-main" data-main="' + i + '" aria-label="Main ' + (i + 1) + ', fermée" ' +
        'style="left:' + x + "%;top:" + y + "%;width:" + taille + "%;--rot:" + (angle - 90) + 'deg">' +
        '<span class="fraise-main__corps">' + svgMain(etat.peaux[i], i === etat.fraise) + "</span></button>";
    }
    racine.innerHTML =
      '<div class="fraise__plateau">' + mains +
        '<div class="fraise__centre" aria-live="polite"></div>' +
      "</div>" +
      '<p class="fraise__message" role="status"></p>' +
      '<ol class="fraise__joueurs">' + joueurs.map(function (j, i) { return '<li data-joueur="' + i + '">' + echapper(j) + "</li>"; }).join("") + "</ol>" +
      '<details class="fraise__historique"><summary>Historique des tirages et probabilités</summary><ol></ol></details>' +
      '<div class="fraise__actions"><button type="button" class="bouton bouton--petit fraise__btn-rejouer" hidden>🔁 Rejouer</button>' +
      '<button type="button" class="bouton bouton--petit fraise__btn-reglages">⚙️ Changer les joueurs</button></div>';
    racine.querySelectorAll(".fraise-main").forEach(function (b) { b.addEventListener("click", function () { ouvrir(Number(b.dataset.main)); }); });
    racine.querySelector(".fraise__btn-rejouer").addEventListener("click", function () { partie(etat.joueurs, etat.mode); });
    racine.querySelector(".fraise__btn-reglages").addEventListener("click", function () { reglages(etat); });
    afficherTour();
  }

  function restantes() { return etat.joueurs.length - etat.ouvertes.length; }

  function afficherTour() {
    var k = restantes(), j = etat.joueurs[etat.tour];
    var mot = etat.mode === "gagne" ? "Chance de trouver la fraise" : "Risque de tomber sur la fraise";
    racine.querySelector(".fraise__centre").innerHTML =
      '<span class="fraise__a-qui">À <strong>' + echapper(j) + "</strong> de choisir</span>" +
      '<span class="fraise__proba">1 sur ' + k + " <small>(" + pourcent(k) + ")</small></span>" +
      '<span class="fraise__proba-legende">' + mot + "</span>";
    racine.querySelectorAll(".fraise__joueurs li").forEach(function (li) { li.classList.toggle("actif", Number(li.dataset.joueur) === etat.tour); });
  }

  function ouvrir(i) {
    if (etat.fini || etat.verrou || etat.ouvertes.indexOf(i) >= 0) return;
    etat.verrou = true;
    var k = restantes(), joueur = etat.tour, nom = etat.joueurs[joueur];
    var b = racine.querySelector('[data-main="' + i + '"]');
    b.classList.add("suspense");
    setTimeout(function () {
      b.classList.remove("suspense");
      b.classList.add("ouverte");
      etat.ouvertes.push(i);
      var trouve = i === etat.fraise;
      b.setAttribute("aria-label", "Main " + (i + 1) + (trouve ? ", contenait la fraise" : ", vide"));
      etat.historique.push({ nom: nom, k: k, trouve: trouve });
      racine.querySelector(".fraise__historique ol").insertAdjacentHTML("beforeend",
        "<li><strong>" + echapper(nom) + "</strong> ouvre une main parmi " + k + "&nbsp;: 1 chance sur " + k + " (" + pourcent(k) + ") → " + (trouve ? "🍓 la fraise&nbsp;!" : "vide") + "</li>");
      var li = racine.querySelector('[data-joueur="' + joueur + '"]');
      var message = racine.querySelector(".fraise__message");
      if (trouve) return fin(joueur, b);
      li.classList.add(etat.mode === "gagne" ? "rate" : "sauve");
      message.innerHTML = "<strong>" + echapper(nom) + "</strong>&nbsp;: " + hasard(etat.mode === "gagne" ? CHAMBRE_RATE : OUF);
      etat.tour = (etat.tour + 1) % etat.joueurs.length;
      etat.verrou = false;
      afficherTour();
    }, 650);
  }

  function fin(joueur, main) {
    etat.fini = true;
    var nom = echapper(etat.joueurs[joueur]);
    var autres = etat.joueurs.filter(function (_, i) { return i !== joueur; }).map(echapper);
    var listeAutres = autres.length > 1 ? autres.slice(0, -1).join(", ") + " et " + autres[autres.length - 1] : autres[0];
    var li = racine.querySelector('[data-joueur="' + joueur + '"]');
    li.classList.add(etat.mode === "gagne" ? "gagnant" : "perdant");
    racine.querySelectorAll(".fraise__joueurs li").forEach(function (l) { l.classList.remove("actif"); });
    var n = etat.joueurs.length, tirage = etat.historique.length;
    var centre, message;
    if (etat.mode === "gagne") {
      centre = '<span class="fraise__a-qui">🏆 <strong>' + nom + "</strong> a trouvé la fraise&nbsp;!</span>";
      message = "Bravo <strong>" + nom + "</strong>&nbsp;! " + listeAutres + " " + hasard(CHAMBRE_AUTRES);
    } else {
      centre = '<span class="fraise__a-qui">😬 <strong>' + nom + "</strong> a perdu&nbsp;!</span>";
      message = "<strong>" + nom + "</strong>&nbsp;: " + hasard(CHAMBRE_PERDANT) + " " + listeAutres + " peu" + (autres.length > 1 ? "vent" : "t") + " rigoler.";
    }
    centre += '<span class="fraise__proba-legende">Trouvée au ' + (tirage === 1 ? "1er" : tirage + "e") + " tirage sur " + n + " mains</span>";
    racine.querySelector(".fraise__centre").innerHTML = centre;
    racine.querySelector(".fraise__message").innerHTML = message +
      '<span class="fraise__astuce">Le saviez-vous&nbsp;? Au départ, chaque joueur avait exactement 1 chance sur ' + n + " (" + pourcent(n) + "), qu'il joue en premier ou en dernier.</span>";
    racine.querySelector(".fraise__btn-rejouer").hidden = false;
    // les autres mains s'ouvrent : toutes vides
    var reste = Array.from(racine.querySelectorAll(".fraise-main:not(.ouverte)"));
    reste.forEach(function (b, k) { setTimeout(function () { b.classList.add("ouverte", "revelee"); }, 500 + k * 120); });
    main.classList.add("gagnante");
  }

  reglages(null);
})();
