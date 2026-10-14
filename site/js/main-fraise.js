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

  var CHAMBRE_ELIMINE = [ // mode élimination : celui qui trouve la fraise
    "Retour à la machine à café.",
    "Vous pouvez aller presser les jus de fruits des finalistes.",
    "La fraise ne pardonne pas.",
    "Fin de l'aventure, mais avec le sourire… enfin, presque.",
    "Vous ferez mieux la prochaine fois. Statistiquement, en tout cas.",
    "Ça, c'est ce qu'on appelle tomber dans les pommes… enfin, dans les fraises.",
  ];

  var etat = null;
  function nomDe(i) { return echapper(etat.joueurs[i]); }
  function liste(noms) { return noms.length > 1 ? noms.slice(0, -1).join(", ") + " et " + noms[noms.length - 1] : noms[0] || ""; }

  /* ───────── Écran de réglage ───────── */
  function reglages(precedents) {
    var n = precedents ? precedents.joueurs.length : 4;
    var mode = precedents ? precedents.mode : "gagne";
    var elim = precedents ? precedents.elim : false;
    racine.innerHTML =
      '<form class="fraise__reglages">' +
        '<p class="fraise__intro">Une seule main cache la fraise 🍓. Un tirage au sort désigne qui commence, puis chacun à son tour ouvre une main… Qui va tomber dessus&nbsp;?</p>' +
        '<div class="fraise__ligne"><label for="fraise-nb">Nombre de joueurs</label>' +
          '<select id="fraise-nb">' + Array.from({ length: 11 }, function (_, i) { var v = i + 2; return '<option value="' + v + '"' + (v === n ? " selected" : "") + ">" + v + "</option>"; }).join("") + "</select></div>" +
        '<fieldset class="fraise__modes"><legend>Déroulement</legend>' +
          '<label><input type="radio" name="fraise-elim" value="non"' + (elim ? "" : " checked") + "> 🎯 Une seule manche</label>" +
          '<label><input type="radio" name="fraise-elim" value="oui"' + (elim ? " checked" : "") + "> 🔥 Élimination&nbsp;: un joueur en moins à chaque manche</label>" +
        "</fieldset>" +
        '<fieldset class="fraise__modes fraise__regle"><legend>Règle du jeu</legend>' +
          '<label><input type="radio" name="fraise-mode" value="gagne"' + (mode === "gagne" ? " checked" : "") + "> 🏆 Celui qui trouve la fraise <strong>gagne</strong></label>" +
          '<label><input type="radio" name="fraise-mode" value="perd"' + (mode === "perd" ? " checked" : "") + "> 😬 Celui qui trouve la fraise <strong>perd</strong></label>" +
        "</fieldset>" +
        '<p class="fraise__note-elim" hidden>À chaque manche, celui qui trouve la fraise est éliminé et on redistribue une main de moins. Le dernier joueur en lice remporte la partie&nbsp;!</p>' +
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
    function majElim() {
      var oui = racine.querySelector('input[name="fraise-elim"]:checked').value === "oui";
      racine.querySelector(".fraise__regle").hidden = oui;
      racine.querySelector(".fraise__note-elim").hidden = !oui;
    }
    champs(); majElim();
    select.addEventListener("change", champs);
    racine.querySelectorAll('input[name="fraise-elim"]').forEach(function (r) { r.addEventListener("change", majElim); });
    racine.querySelector("form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var joueurs = Array.from(zoneNoms.querySelectorAll("input")).map(function (inp, i) { return inp.value.trim() || "Joueur " + (i + 1); });
      partie(joueurs, racine.querySelector('input[name="fraise-mode"]:checked').value, racine.querySelector('input[name="fraise-elim"]:checked').value === "oui");
    });
  }

  /* ───────── Partie (une ou plusieurs manches) ───────── */
  function partie(joueurs, mode, elim) {
    etat = { joueurs: joueurs, mode: mode, elim: elim, enJeu: joueurs.map(function (_, i) { return i; }), elimines: [], manche: 0 };
    racine.innerHTML =
      '<div class="fraise__plateau"></div>' +
      '<p class="fraise__message" role="status"></p>' +
      '<ol class="fraise__joueurs">' + joueurs.map(function (j, i) { return '<li data-joueur="' + i + '">' + echapper(j) + "</li>"; }).join("") + "</ol>" +
      '<details class="fraise__historique"><summary>Historique des tirages et probabilités</summary><ol></ol></details>' +
      '<div class="fraise__actions">' +
        '<button type="button" class="bouton bouton--petit fraise__btn-suite" hidden>➡️ Manche suivante</button>' +
        '<button type="button" class="bouton bouton--petit fraise__btn-rejouer" hidden>🔁 Rejouer</button>' +
        '<button type="button" class="bouton bouton--petit fraise__btn-reglages">⚙️ Changer les joueurs</button></div>';
    racine.querySelector(".fraise__btn-suite").addEventListener("click", nouvelleManche);
    racine.querySelector(".fraise__btn-rejouer").addEventListener("click", function () { partie(etat.joueurs, etat.mode, etat.elim); });
    racine.querySelector(".fraise__btn-reglages").addEventListener("click", function () { reglages(etat); });
    nouvelleManche();
  }

  function nouvelleManche() {
    var n = etat.enJeu.length;
    etat.manche++;
    etat.fraise = Math.floor(Math.random() * n);
    etat.ouvertes = []; etat.tirages = 0; etat.fini = false; etat.verrou = true;
    racine.querySelector(".fraise__btn-suite").hidden = true;
    var taille = Math.min(19, 150 / n + 4); // largeur d'une main, en % du plateau
    var mains = "";
    for (var i = 0; i < n; i++) {
      var angle = -90 + (360 / n) * i;
      var rad = angle * Math.PI / 180;
      var x = 50 + 37 * Math.cos(rad), y = 50 + 37 * Math.sin(rad);
      mains += '<button type="button" class="fraise-main" data-main="' + i + '" aria-label="Main ' + (i + 1) + ', fermée" ' +
        'style="left:' + x + "%;top:" + y + "%;width:" + taille + "%;--rot:" + (angle - 90) + 'deg">' +
        '<span class="fraise-main__corps">' + svgMain(hasard(PEAUX), i === etat.fraise) + "</span></button>";
    }
    var plateau = racine.querySelector(".fraise__plateau");
    plateau.innerHTML = mains + '<div class="fraise__centre" aria-live="polite"></div>';
    plateau.querySelectorAll(".fraise-main").forEach(function (b) { b.addEventListener("click", function () { ouvrir(Number(b.dataset.main)); }); });
    racine.querySelectorAll(".fraise__joueurs li").forEach(function (li) { li.classList.remove("sauve", "rate", "actif"); });
    if (etat.elim) racine.querySelector(".fraise__historique ol").insertAdjacentHTML("beforeend", '<li class="fraise__historique-manche">Manche ' + etat.manche + " — " + n + " joueurs en lice</li>");
    racine.querySelector(".fraise__message").innerHTML = etat.elim ? "Manche " + etat.manche + "&nbsp;: " + n + " joueurs en lice, " + n + " mains." : "";
    tirageAuSort();
  }

  // Tirage au sort de celui qui commence : la surbrillance tourne entre les joueurs puis ralentit
  function tirageAuSort() {
    var n = etat.enJeu.length, choisi = Math.floor(Math.random() * n), total = 2 * n + choisi + 1, pas = 0;
    var puces = etat.enJeu.map(function (j) { return racine.querySelector('[data-joueur="' + j + '"]'); });
    racine.querySelector(".fraise__centre").innerHTML = '<span class="fraise__a-qui">🎲 Tirage au sort…</span><span class="fraise__proba-legende">Qui va commencer&nbsp;?</span>';
    (function suivant() {
      puces.forEach(function (p, k) { p.classList.toggle("tirage", k === pas % n); });
      pas++;
      if (pas < total) return setTimeout(suivant, 60 + 260 * Math.pow(pas / total, 2));
      setTimeout(function () {
        puces.forEach(function (p) { p.classList.remove("tirage"); });
        etat.ordre = etat.enJeu.slice(choisi).concat(etat.enJeu.slice(0, choisi));
        etat.tourPos = 0;
        racine.querySelector(".fraise__message").innerHTML = (etat.elim ? "Manche " + etat.manche + "&nbsp;: " : "") + "🎲 Tirage au sort&nbsp;: <strong>" + nomDe(etat.ordre[0]) + "</strong> commence&nbsp;!";
        etat.verrou = false;
        afficherTour();
      }, 350);
    })();
  }

  function joueurCourant() { return etat.ordre[etat.tourPos % etat.ordre.length]; }
  function restantes() { return etat.enJeu.length - etat.ouvertes.length; }

  function afficherTour() {
    var k = restantes(), j = joueurCourant();
    var mot = etat.elim ? "Risque d'être éliminé" : etat.mode === "gagne" ? "Chance de trouver la fraise" : "Risque de tomber sur la fraise";
    racine.querySelector(".fraise__centre").innerHTML =
      '<span class="fraise__a-qui">À <strong>' + nomDe(j) + "</strong> de choisir</span>" +
      '<span class="fraise__proba">1 sur ' + k + " <small>(" + pourcent(k) + ")</small></span>" +
      '<span class="fraise__proba-legende">' + mot + "</span>";
    racine.querySelectorAll(".fraise__joueurs li").forEach(function (li) { li.classList.toggle("actif", Number(li.dataset.joueur) === j); });
  }

  function ouvrir(i) {
    if (etat.fini || etat.verrou || etat.ouvertes.indexOf(i) >= 0) return;
    etat.verrou = true;
    var k = restantes(), joueur = joueurCourant(), nom = nomDe(joueur);
    var b = racine.querySelector('[data-main="' + i + '"]');
    b.classList.add("suspense");
    setTimeout(function () {
      b.classList.remove("suspense");
      b.classList.add("ouverte");
      etat.ouvertes.push(i); etat.tirages++;
      var trouve = i === etat.fraise;
      b.setAttribute("aria-label", "Main " + (i + 1) + (trouve ? ", contenait la fraise" : ", vide"));
      racine.querySelector(".fraise__historique ol").insertAdjacentHTML("beforeend",
        "<li><strong>" + nom + "</strong> ouvre une main parmi " + k + "&nbsp;: 1 chance sur " + k + " (" + pourcent(k) + ") → " + (trouve ? "🍓 la fraise&nbsp;!" : "vide") + "</li>");
      if (trouve) return finManche(joueur, b);
      var gagne = !etat.elim && etat.mode === "gagne";
      racine.querySelector('[data-joueur="' + joueur + '"]').classList.add(gagne ? "rate" : "sauve");
      racine.querySelector(".fraise__message").innerHTML = "<strong>" + nom + "</strong>&nbsp;: " + hasard(gagne ? CHAMBRE_RATE : OUF);
      etat.tourPos++;
      etat.verrou = false;
      afficherTour();
    }, 650);
  }

  function finManche(joueur, main) {
    etat.fini = true;
    var n = etat.enJeu.length, nom = nomDe(joueur);
    var autres = etat.enJeu.filter(function (j) { return j !== joueur; }).map(nomDe);
    racine.querySelectorAll(".fraise__joueurs li").forEach(function (l) { l.classList.remove("actif"); });
    var li = racine.querySelector('[data-joueur="' + joueur + '"]');
    var centre, message, astuce = "";
    var trouvee = '<span class="fraise__proba-legende">Trouvée au ' + (etat.tirages === 1 ? "1er" : etat.tirages + "e") + " tirage sur " + n + " mains</span>";

    if (etat.elim) {
      etat.enJeu = etat.enJeu.filter(function (j) { return j !== joueur; });
      etat.elimines.push(joueur);
      li.classList.add("elimine");
      if (etat.enJeu.length === 1) {
        var champion = etat.enJeu[0];
        racine.querySelector('[data-joueur="' + champion + '"]').classList.add("gagnant");
        centre = '<span class="fraise__a-qui">🏆 <strong>' + nomDe(champion) + "</strong> remporte la partie&nbsp;!</span>" + trouvee;
        message = "🍓 <strong>" + nom + "</strong> tombe sur la fraise en finale&nbsp;: " + hasard(CHAMBRE_ELIMINE) +
          " Bravo <strong>" + nomDe(champion) + "</strong>, le meilleur… ou le plus chanceux&nbsp;?";
        astuce = "Ordre des éliminations&nbsp;: " + etat.elimines.map(nomDe).join(" → ") + ". Le saviez-vous&nbsp;? Au départ, chacun des " + etat.joueurs.length +
          " joueurs avait exactement 1 chance sur " + etat.joueurs.length + " (" + pourcent(etat.joueurs.length) + ") de gagner.";
        racine.querySelector(".fraise__btn-rejouer").hidden = false;
      } else {
        centre = '<span class="fraise__a-qui">🍓 <strong>' + nom + "</strong> sort du jeu&nbsp;!</span>" + trouvee;
        message = "<strong>" + nom + "</strong>&nbsp;: " + hasard(CHAMBRE_ELIMINE) + " Encore " + etat.enJeu.length + " joueurs en lice" + (etat.enJeu.length === 2 ? "&nbsp;: c'est la finale&nbsp;!" : ".");
        racine.querySelector(".fraise__btn-suite").hidden = false;
      }
    } else {
      li.classList.add(etat.mode === "gagne" ? "gagnant" : "perdant");
      if (etat.mode === "gagne") {
        centre = '<span class="fraise__a-qui">🏆 <strong>' + nom + "</strong> a trouvé la fraise&nbsp;!</span>" + trouvee;
        message = "Bravo <strong>" + nom + "</strong>&nbsp;! " + liste(autres) + " " + hasard(CHAMBRE_AUTRES);
      } else {
        centre = '<span class="fraise__a-qui">😬 <strong>' + nom + "</strong> a perdu&nbsp;!</span>" + trouvee;
        message = "<strong>" + nom + "</strong>&nbsp;: " + hasard(CHAMBRE_PERDANT) + " " + liste(autres) + " peu" + (autres.length > 1 ? "vent" : "t") + " rigoler.";
      }
      astuce = "Le saviez-vous&nbsp;? Au départ, chaque joueur avait exactement 1 chance sur " + n + " (" + pourcent(n) + "), qu'il joue en premier ou en dernier.";
      racine.querySelector(".fraise__btn-rejouer").hidden = false;
    }
    racine.querySelector(".fraise__centre").innerHTML = centre;
    racine.querySelector(".fraise__message").innerHTML = message + (astuce ? '<span class="fraise__astuce">' + astuce + "</span>" : "");
    // les autres mains s'ouvrent : toutes vides
    Array.from(racine.querySelectorAll(".fraise-main:not(.ouverte)")).forEach(function (b, k) { setTimeout(function () { b.classList.add("ouverte", "revelee"); }, 500 + k * 120); });
    main.classList.add("gagnante");
  }

  reglages(null);
})();
