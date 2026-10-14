/* =========================================================
   Jeux CoPanier : « Attrape les fruits » et « Le saut de la pomme »
   ========================================================= */
(function () {
  var FRUITS = ["🍎", "🍐", "🍊", "🍓", "🍒", "🍇", "🍑", "🥝", "🍌", "🍋"];
  // Logo CoPanier dessiné dans les jeux (filigrane, banderole, panneaux, bonus)
  var LOGO = new Image(); LOGO.src = "/images/logo-copanier.webp";
  var LOGO_VERT = null; // version du logo dont les parties blanches sont passées en vert (lisible sur fond clair)
  LOGO.addEventListener("load", function () {
    try {
      var cv = document.createElement("canvas"); cv.width = LOGO.naturalWidth; cv.height = LOGO.naturalHeight;
      var cx = cv.getContext("2d"); cx.drawImage(LOGO, 0, 0);
      var img = cx.getImageData(0, 0, cv.width, cv.height), d = img.data;
      for (var i = 0; i < d.length; i += 4) {
        var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
        if (d[i + 3] > 0 && mn > 170 && mx - mn < 40) { d[i] = 63; d[i + 1] = 102; d[i + 2] = 83; } // blanc → vert #3f6653
      }
      cx.putImageData(img, 0, 0);
      LOGO_VERT = cv;
    } catch (e) { LOGO_VERT = null; }
  });
  function logoPret() { return LOGO.complete && LOGO.naturalWidth > 0; }
  function dessinerLogo(c, x, y, largeur, alpha) {
    if (!logoPret()) return;
    var h = largeur * LOGO.naturalHeight / LOGO.naturalWidth;
    c.save(); if (alpha !== undefined) c.globalAlpha = alpha;
    c.drawImage(LOGO_VERT || LOGO, x - largeur / 2, y - h / 2, largeur, h);
    c.restore();
  }
  // Petit cartouche blanc arrondi qui porte le logo
  function cartouche(c, x, y, largeur, s) {
    var h = largeur * 0.42;
    c.save(); c.fillStyle = "#ffffff"; c.strokeStyle = "#f4661c"; c.lineWidth = 2 * s;
    c.beginPath();
    if (c.roundRect) c.roundRect(x - largeur / 2, y - h / 2, largeur, h, 10 * s); else c.rect(x - largeur / 2, y - h / 2, largeur, h);
    c.fill(); c.stroke(); c.restore();
    dessinerLogo(c, x, y, largeur * 0.86);
  }
  var URL_JEUX = "https://copanierdefruits.copanier.fr/jeux-fruits/";
  function hasard(t) { return t[Math.floor(Math.random() * t.length)]; }
  function record(cle, val) {
    try {
      if (val === undefined) return parseInt(localStorage.getItem(cle), 10) || 0;
      localStorage.setItem(cle, String(val));
    } catch (e) { return 0; }
  }
  /* ---------- Classement partagé (Supabase, fonctions contrôlées) ---------- */
  var SB_URL = "https://eykdcoqdhllbigxujgsl.supabase.co";
  var SB_CLE = "sb_publishable_BHTeFJEowRdZC278ZO9RDQ_q08_-91A";
  function rpc(nom, corps) {
    return fetch(SB_URL + "/rest/v1/rpc/" + nom, {
      method: "POST",
      headers: { apikey: SB_CLE, "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.message) || "erreur"); return j; });
    });
  }
  function echapper(t) { return String(t).replace(/[&<>"]/g, function (x) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]; }); }
  function unite(jeu, n) { return jeu === "saut" ? n + " m" : n + " fruit" + (n > 1 ? "s" : ""); }
  function rangTexte(n) { return n === 1 ? "1er" : n + "e"; }
  // Podium (3 premiers) toujours visible ; le reste du classement se déroule dans une petite zone défilante
  function listeTop(jeu, top, surligner) {
    if (!top || !top.length) return '<p class="jeu__classement-vide">Aucun score pour l\'instant : soyez le premier&nbsp;!</p>';
    var medailles = ["🥇", "🥈", "🥉"], monRang = -1;
    var lignes = top.map(function (l, i) {
      var moi = surligner && monRang < 0 && l.prenom === surligner.prenom && l.score === surligner.score;
      if (moi) monRang = i;
      return '<li' + (moi ? ' class="moi"' : "") + '><span class="jeu__top-rang">' + (medailles[i] || i + 1) + '</span><span class="jeu__top-nom">' + echapper(l.prenom) + '</span><span class="jeu__top-score">' + unite(jeu, l.score) + "</span></li>";
    });
    var html = '<ol class="jeu__top">' + lignes.slice(0, 3).join("") + "</ol>";
    if (lignes.length > 3) {
      html += '<details class="jeu__suite"' + (monRang >= 3 ? " open" : "") + '><summary>Voir tout le classement (' + lignes.length + " joueurs)</summary>" +
        '<ol class="jeu__top jeu__top--suite" start="4">' + lignes.slice(3).join("") + "</ol></details>";
    }
    return html;
  }
  function afficherClassement(jeu, surligner) {
    var zone = document.querySelector('[data-classement="' + jeu + '"] .jeu__classement-liste');
    if (!zone) return;
    rpc("classement_complet", { p_jeu: jeu })
      .catch(function () { return rpc("top_scores", { p_jeu: jeu }); })
      .then(function (top) {
        zone.innerHTML = listeTop(jeu, top, surligner);
        var moi = zone.querySelector(".jeu__top--suite .moi");
        if (moi) moi.parentNode.scrollTop = moi.offsetTop - moi.parentNode.offsetTop - 40;
      })
      .catch(function () { zone.innerHTML = '<p class="jeu__classement-vide">Classement momentanément indisponible.</p>'; });
  }
  function prenomMemorise(val) {
    try { if (val === undefined) return localStorage.getItem("copanier-prenom-jeux") || ""; localStorage.setItem("copanier-prenom-jeux", val); } catch (e) { return ""; }
  }
  // Formulaire d'inscription au classement, ajouté à l'écran de fin de partie
  function formulaireClassement(conteneur, jeu, score) {
    if (!score) return;
    var e = conteneur.querySelector(".jeu__ecran");
    var f = document.createElement("form");
    f.className = "jeu__inscription";
    f.innerHTML = '<label>Inscrivez-vous au classement&nbsp;: <input name="prenom" maxlength="20" autocomplete="given-name" placeholder="Votre prénom ou pseudo" required></label>' +
      '<button type="submit" class="bouton bouton--petit">🏆 Enregistrer mon score</button><p class="jeu__inscription-msg" role="status"></p>';
    var bouton = e.querySelector("[data-jouer]");
    e.insertBefore(f, bouton);
    var champ = f.querySelector("input"), msg = f.querySelector(".jeu__inscription-msg");
    champ.value = prenomMemorise();
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var prenom = champ.value.trim();
      if (prenom.length < 2) { msg.textContent = "Indiquez au moins 2 lettres."; return; }
      f.querySelector("button").disabled = true;
      msg.textContent = "Enregistrement…";
      rpc("enregistrer_score", { p_jeu: jeu, p_prenom: prenom, p_score: score }).then(function (r) {
        prenomMemorise(r.prenom);
        f.innerHTML = '<p class="jeu__rang">' + (r.rang <= 3 ? "🎉 " : "") + "Bravo " + echapper(r.prenom) + "&nbsp;! Vous êtes <strong>" + rangTexte(r.rang) + "</strong> sur " + r.total + " joueur" + (r.total > 1 ? "s" : "") + ".</p>";
        afficherClassement(jeu, { prenom: r.prenom, score: score });
      }).catch(function (err) {
        f.querySelector("button").disabled = false;
        msg.textContent = /prénom/.test(err.message) ? "Ce prénom n'est pas accepté : lettres uniquement, 2 à 20 caractères." : "L'enregistrement n'a pas abouti, réessayez dans un instant.";
      });
    });
  }

  // Cœur dessiné (les émojis ❤️ ne s'affichent pas sur tous les téléphones)
  function coeur(c, x, y, t, plein) {
    c.save(); c.translate(x, y); c.scale(t / 20, t / 20);
    c.beginPath(); c.moveTo(0, 6);
    c.bezierCurveTo(-10, -2, -8, -10, 0, -5); c.bezierCurveTo(8, -10, 10, -2, 0, 6);
    c.closePath();
    c.fillStyle = plein ? "#e8432e" : "rgba(63,102,83,.18)"; c.fill();
    c.restore();
  }

  function visible(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; }

  // Prépare un canvas net sur écran haute définition, à la largeur de son conteneur
  function preparer(canvas, ratio) {
    var largeur = Math.min(canvas.parentNode.clientWidth, 760);
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = largeur + "px";
    canvas.style.height = Math.round(largeur * ratio) + "px";
    canvas.width = Math.round(largeur * dpr);
    canvas.height = Math.round(largeur * ratio * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, W: largeur, H: largeur * ratio, s: Math.max(largeur / 600, 0.8) };
  }

  function ecran(conteneur, titre, texte, bouton, partage) {
    var e = conteneur.querySelector(".jeu__ecran");
    e.innerHTML = '<p class="jeu__titre">' + titre + "</p><p>" + texte + '</p><button type="button" class="bouton" data-jouer>' + bouton + "</button>" +
      (partage ? '<p class="jeu__partage"><a class="quiz__btn-partage" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(partage) + '">Défier un collègue sur WhatsApp</a> <a class="quiz__btn-partage" href="mailto:?subject=' + encodeURIComponent("Défi : les jeux des fruits") + "&body=" + encodeURIComponent(partage) + '">Par e-mail</a></p>' : "");
    e.hidden = false;
    return e.querySelector("[data-jouer]");
  }

  /* ================= Attrape les fruits ================= */
  function attrape(conteneur) {
    var canvas = conteneur.querySelector("canvas");
    var g, panier, objets, vies, score, vitesse, prochain, dernier, enCours = false, anim, banderole, prochaineBanderole;
    var cleRecord = "copanier-record-attrape";

    function nouvelle() {
      g = preparer(canvas, window.innerWidth < 600 ? 1.2 : 0.75);
      panier = { x: g.W / 2, l: 90 * g.s };
      objets = []; vies = 3; score = 0; vitesse = 2.2 * g.s; prochain = 0; dernier = performance.now();
      banderole = null; prochaineBanderole = 90;
      enCours = true;
      conteneur.querySelector(".jeu__ecran").hidden = true;
      anim = requestAnimationFrame(boucle);
    }

    function boucle(t) {
      if (!enCours) return;
      var dt = Math.min(40, t - dernier) / 16.67; dernier = t;
      // Nouveaux objets : de plus en plus fréquents et rapides
      prochain -= dt;
      if (prochain <= 0) {
        var ver = score > 4 && Math.random() < 0.18;
        var logo = !ver && score > 2 && Math.random() < 0.07;
        objets.push({ x: 40 * g.s + Math.random() * (g.W - 80 * g.s), y: -30 * g.s, v: vitesse * (0.8 + Math.random() * 0.5), e: ver ? "🐛" : hasard(FRUITS), ver: ver, logo: logo });
        prochain = Math.max(22, 70 - score * 1.4);
      }
      // Une banderole CoPanier traverse le ciel de temps en temps
      prochaineBanderole -= dt;
      if (!banderole && prochaineBanderole <= 0) { banderole = { x: g.W + 40 * g.s }; prochaineBanderole = 650 + Math.random() * 400; }
      if (banderole) { banderole.x -= 2.2 * g.s * dt; if (banderole.x < -220 * g.s) banderole = null; }
      vitesse = (2.2 + score * 0.07) * g.s;
      var hautPanier = g.H - 46 * g.s;
      for (var i = objets.length - 1; i >= 0; i--) {
        var o = objets[i];
        o.y += o.v * dt;
        var attrape = o.y >= hautPanier - 10 * g.s && o.y <= hautPanier + 20 * g.s && Math.abs(o.x - panier.x) < panier.l / 2 + 8 * g.s;
        if (attrape) {
          objets.splice(i, 1);
          if (o.ver) { vies--; secousse(); } else score += o.logo ? 3 : 1;
        } else if (o.y > g.H + 20 * g.s) {
          objets.splice(i, 1);
          if (!o.ver) { vies--; secousse(); }
        }
      }
      dessiner(hautPanier);
      if (vies <= 0) return fin();
      anim = requestAnimationFrame(boucle);
    }

    function dessiner(hautPanier) {
      var c = g.ctx, W = g.W, H = g.H, s = g.s;
      var fond = c.createLinearGradient(0, 0, 0, H);
      fond.addColorStop(0, "#e8f0eb"); fond.addColorStop(1, "#fbf8f2");
      c.fillStyle = fond; c.fillRect(0, 0, W, H);
      c.fillStyle = "#3f6653"; c.fillRect(0, H - 8 * s, W, 8 * s);
      // Filigrane du logo au centre du décor
      dessinerLogo(c, W / 2, H * 0.45, Math.min(320 * s, W * 0.6), 0.1);
      // Banderole tirée par un avion
      if (banderole) {
        c.font = 30 * s + "px serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText("✈️", banderole.x - 30 * s, 62 * s);
        c.strokeStyle = "#52695d"; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(banderole.x - 14 * s, 62 * s); c.lineTo(banderole.x + 10 * s, 62 * s); c.stroke();
        cartouche(c, banderole.x + 80 * s, 62 * s, 140 * s, s);
      }
      c.textAlign = "center"; c.textBaseline = "middle";
      c.font = 40 * s + "px serif";
      objets.forEach(function (o) {
        if (o.logo) cartouche(c, o.x, o.y, 74 * s, s);
        else c.fillText(o.e, o.x, o.y);
      });
      // Cagette en bois
      var l = panier.l, h = 34 * s, x = panier.x - l / 2, y = hautPanier;
      c.fillStyle = "#c8915a"; c.fillRect(x, y, l, h);
      c.fillStyle = "#a8743f";
      for (var k = 0; k < 3; k++) c.fillRect(x, y + 4 * s + k * 10 * s, l, 4 * s);
      c.fillStyle = "#8a5a2b"; c.fillRect(x, y, 6 * s, h); c.fillRect(x + l - 6 * s, y, 6 * s, h);
      // Marque imprimée sur la cagette
      c.fillStyle = "#2f4e3f"; c.font = "700 " + 12 * s + "px Rubik, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("COPANIER", panier.x, y + h / 2 + 1 * s);
      // Score et vies
      c.textAlign = "left"; c.fillStyle = "#3f6653"; c.font = "600 " + 22 * s + "px Rubik, sans-serif";
      c.fillText("Score : " + score, 14 * s, 24 * s);
      for (var v = 0; v < 3; v++) coeur(c, W - (22 + v * 28) * s, 24 * s, 24 * s, v < vies);
    }

    function secousse() { canvas.classList.remove("secoue"); void canvas.offsetWidth; canvas.classList.add("secoue"); }

    function fin() {
      enCours = false;
      var meilleur = record(cleRecord);
      var nouveau = score > meilleur;
      if (nouveau) record(cleRecord, score);
      ecran(conteneur, nouveau && score > 0 ? "🏆 Nouveau record&nbsp;!" : "Partie terminée",
        "Vous avez attrapé <strong>" + score + "</strong> fruit" + (score > 1 ? "s" : "") + ". Record&nbsp;: <strong>" + Math.max(score, meilleur) + "</strong>",
        "Rejouer", "J'ai attrapé " + score + " fruits au jeu de CoPanier 🍎 Tu fais mieux ? " + URL_JEUX).addEventListener("click", nouvelle);
      formulaireClassement(conteneur, "attrape", score);
    }

    function deplacer(clientX) {
      if (!enCours) return;
      var r = canvas.getBoundingClientRect();
      panier.x = Math.max(panier.l / 2, Math.min(g.W - panier.l / 2, clientX - r.left));
    }
    canvas.addEventListener("pointermove", function (e) { deplacer(e.clientX); });
    canvas.addEventListener("pointerdown", function (e) { deplacer(e.clientX); });
    document.addEventListener("keydown", function (e) {
      if (!enCours || !visible(canvas)) return;
      if (e.key === "ArrowLeft") { panier.x = Math.max(panier.l / 2, panier.x - 30 * g.s); e.preventDefault(); }
      if (e.key === "ArrowRight") { panier.x = Math.min(g.W - panier.l / 2, panier.x + 30 * g.s); e.preventDefault(); }
    });

    g = preparer(canvas, window.innerWidth < 600 ? 1.2 : 0.75); panier = { x: g.W / 2, l: 90 * g.s }; objets = []; vies = 3; score = 0;
    dessiner(g.H - 46 * g.s);
    LOGO.addEventListener("load", function () { if (!enCours) dessiner(g.H - 46 * g.s); });
    // Plateau redimensionné hors partie (rotation du téléphone, page chargée dans un onglet masqué…)
    window.addEventListener("resize", function () {
      if (enCours || Math.min(canvas.parentNode.clientWidth, 760) === g.W) return;
      g = preparer(canvas, window.innerWidth < 600 ? 1.2 : 0.75); panier = { x: g.W / 2, l: 90 * g.s }; dessiner(g.H - 46 * g.s);
    });
    ecran(conteneur, "Attrape les fruits", "Déplacez la corbeille avec le doigt, la souris ou les flèches.<br>🍎 Fruit attrapé&nbsp;: <strong>+1</strong> · Logo CoPanier&nbsp;: <strong>+3</strong><br>🐛 Ver attrapé ou fruit tombé au sol&nbsp;: <strong>une vie en moins</strong><br>Vous avez ❤️ 3 vies." + (record(cleRecord) ? "<br>Votre record&nbsp;: <strong>" + record(cleRecord) + "</strong>" : ""), "Jouer").addEventListener("click", nouvelle);
  }

  /* ================= Le saut de la pomme ================= */
  function saut(conteneur) {
    var canvas = conteneur.querySelector("canvas");
    var g, joueur, obstacles, bonus, sol, vitesse, distance, prochain, dernier, enCours = false, nuages, panneaux, prochainPanneau;
    var cleRecord = "copanier-record-saut";
    var OBSTACLES = ["🪨", "🐛", "🌵", "🪵"];

    function initialiser() {
      g = preparer(canvas, window.innerWidth < 600 ? 0.95 : 0.42);
      sol = g.H - 34 * g.s;
      joueur = { x: 70 * g.s, y: sol, vy: 0, taille: 40 * g.s };
      obstacles = []; bonus = []; vitesse = 5 * g.s; distance = 0; prochain = 60;
      nuages = [0, 1, 2].map(function (i) { return { x: i * g.W / 3 + 40 * g.s, y: (20 + i * 12) * g.s }; });
      // Panneaux CoPanier qui défilent en arrière-plan
      panneaux = [{ x: g.W * 0.62 }]; prochainPanneau = 420;
    }

    function nouvelle() {
      initialiser();
      enCours = true; dernier = performance.now();
      conteneur.querySelector(".jeu__ecran").hidden = true;
      requestAnimationFrame(boucle);
    }

    function sauter() {
      if (!enCours) return;
      if (joueur.y >= sol - 0.5) joueur.vy = -13.5 * g.s;
    }

    function boucle(t) {
      if (!enCours) return;
      var dt = Math.min(40, t - dernier) / 16.67; dernier = t;
      vitesse = (5 + distance / 400) * g.s;
      distance += vitesse * dt / g.s / 6;
      // Saut : gravité
      joueur.vy += 0.75 * g.s * dt;
      joueur.y = Math.min(sol, joueur.y + joueur.vy * dt);
      if (joueur.y >= sol) joueur.vy = 0;
      // Obstacles et bonus
      prochain -= dt;
      if (prochain <= 0) {
        obstacles.push({ x: g.W + 20 * g.s, e: hasard(OBSTACLES) });
        if (Math.random() < 0.35) bonus.push({ x: g.W + (120 + Math.random() * 120) * g.s, y: sol - (70 + Math.random() * 40) * g.s, e: hasard(FRUITS) });
        prochain = 55 + Math.random() * 70 - Math.min(30, distance / 40);
      }
      obstacles.forEach(function (o) { o.x -= vitesse * dt; });
      bonus.forEach(function (b) { b.x -= vitesse * dt; });
      obstacles = obstacles.filter(function (o) { return o.x > -40 * g.s; });
      nuages.forEach(function (n) { n.x -= vitesse * dt * 0.2; if (n.x < -60 * g.s) n.x = g.W + 40 * g.s; });
      prochainPanneau -= dt;
      if (prochainPanneau <= 0) { panneaux.push({ x: g.W + 90 * g.s }); prochainPanneau = 380 + Math.random() * 360; }
      panneaux.forEach(function (p) { p.x -= vitesse * dt * 0.55; });
      panneaux = panneaux.filter(function (p) { return p.x > -120 * g.s; });
      // Collisions (boîtes réduites pour être tolérant)
      var r = joueur.taille * 0.32;
      for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (Math.abs(o.x - joueur.x) < r + 12 * g.s && joueur.y > sol - 26 * g.s) { dessiner(); return fin(); }
      }
      for (var k = bonus.length - 1; k >= 0; k--) {
        var b = bonus[k];
        if (Math.abs(b.x - joueur.x) < r + 14 * g.s && Math.abs(b.y - (joueur.y - joueur.taille / 2)) < r + 18 * g.s) { distance += 25; bonus.splice(k, 1); }
        else if (b.x < -40 * g.s) bonus.splice(k, 1);
      }
      dessiner();
      requestAnimationFrame(boucle);
    }

    function dessiner() {
      var c = g.ctx, W = g.W, H = g.H, s = g.s;
      c.fillStyle = "#e8f0eb"; c.fillRect(0, 0, W, H);
      c.font = 34 * s + "px serif"; c.textAlign = "center"; c.textBaseline = "middle";
      nuages.forEach(function (n) { c.globalAlpha = 0.5; c.fillText("☁️", n.x, n.y); c.globalAlpha = 1; });
      // Panneaux publicitaires CoPanier (poteaux + cartouche)
      panneaux.forEach(function (p) {
        c.fillStyle = "#8a5a2b"; c.fillRect(p.x - 40 * s, sol - 58 * s, 5 * s, 62 * s); c.fillRect(p.x + 35 * s, sol - 58 * s, 5 * s, 62 * s);
        cartouche(c, p.x, sol - 66 * s, 120 * s, s);
      });
      c.fillStyle = "#3f6653"; c.fillRect(0, sol + 4 * s, W, H - sol);
      c.fillStyle = "#5a8a72";
      for (var x = -(distance * 6 * s) % (40 * s); x < W; x += 40 * s) c.fillRect(x, sol + 10 * s, 18 * s, 3 * s);
      c.textBaseline = "alphabetic";
      c.font = 34 * s + "px serif";
      obstacles.forEach(function (o) { c.fillText(o.e, o.x, sol + 6 * s); });
      c.font = 28 * s + "px serif";
      bonus.forEach(function (b) { c.fillText(b.e, b.x, b.y); });
      // La pomme qui tourne en sautant
      c.save(); c.translate(joueur.x, joueur.y - joueur.taille / 2 + 6 * s);
      c.rotate(joueur.y < sol ? distance / 8 : 0);
      c.font = joueur.taille + "px serif"; c.textBaseline = "middle"; c.fillText("🍎", 0, 0);
      c.restore();
      c.textAlign = "right"; c.textBaseline = "middle"; c.fillStyle = "#3f6653"; c.font = "600 " + 20 * s + "px Rubik, sans-serif";
      c.fillText(Math.floor(distance) + " m", W - 14 * s, 22 * s);
    }

    function fin() {
      enCours = false;
      var points = Math.floor(distance), meilleur = record(cleRecord), nouveau = points > meilleur;
      if (nouveau) record(cleRecord, points);
      ecran(conteneur, nouveau ? "🏆 Nouveau record&nbsp;!" : "Aïe, un obstacle&nbsp;!",
        "Votre pomme a parcouru <strong>" + points + " m</strong>. Record&nbsp;: <strong>" + Math.max(points, meilleur) + " m</strong>",
        "Rejouer", "Ma pomme a parcouru " + points + " m au jeu de CoPanier 🍎 Tu fais mieux ? " + URL_JEUX).addEventListener("click", nouvelle);
      formulaireClassement(conteneur, "saut", points);
    }

    document.addEventListener("keydown", function (e) {
      if ((e.code === "Space" || e.key === "ArrowUp") && visible(canvas)) {
        var ecranVisible = !conteneur.querySelector(".jeu__ecran").hidden;
        if (enCours) { e.preventDefault(); sauter(); }
        else if (ecranVisible && document.activeElement === document.body) { e.preventDefault(); nouvelle(); }
      }
    });
    canvas.addEventListener("pointerdown", function (e) { e.preventDefault(); sauter(); });

    initialiser(); dessiner();
    LOGO.addEventListener("load", function () { if (!enCours) dessiner(); });
    window.addEventListener("resize", function () {
      if (enCours || Math.min(canvas.parentNode.clientWidth, 760) === g.W) return;
      initialiser(); dessiner();
    });
    ecran(conteneur, "Le saut de la pomme", "Appuyez sur la barre espace, la flèche du haut ou touchez l'écran pour sauter par-dessus les obstacles. Attrapez les fruits en l'air pour gagner des mètres&nbsp;!" + (record(cleRecord) ? "<br>Votre record&nbsp;: <strong>" + record(cleRecord) + " m</strong>" : ""), "Jouer").addEventListener("click", nouvelle);
  }

  var a = document.querySelector('[data-jeu="attrape"]'); if (a) attrape(a);
  afficherClassement("attrape"); afficherClassement("saut");
  var b = document.querySelector('[data-jeu="saut"]'); if (b) saut(b);
})();
