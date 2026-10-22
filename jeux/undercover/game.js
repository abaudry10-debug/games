const WS = W.map((w, i) => ({ id: "w" + (i + 1), p: w[0], a: w[1], b: w[2] }));
const IS = IMG.map((m, i) => ({ id: "i" + (i + 1), p: "image", a: m[0], la: m[1], b: m[2], lb: m[3] }));
const KEY = "jeux.undercover.v1";
const ROLE = { c: "Civil", u: "Undercover", w: "Mr White" };
const PTS = { c: 2, u: 10, w: 6 };
const app = document.getElementById("app");
let S, lastScreen = null, lock = null;

function defaults() {
  return { screen: "setup", players: ["Léa", "Tom", "Sam", "Inès", "Hugo"], example: true,
    mode: "mots", packs: { classique: true, soiree: true, culture: true }, nU: 1, nW: 1, custom: [],
    scores: {}, used: [], gameNo: 0, g: null, msg: "", arm: "" };
}
function load(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ players: S.players, mode: S.mode, packs: S.packs, nU: S.nU, nW: S.nW, custom: S.custom,
    scores: S.scores, used: S.used, gameNo: S.gameNo, g: S.g, screen: S.screen })); } catch (e) {}
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pool = () => S.mode === "images" ? IS : WS.filter(w => S.packs[w.p]).concat(S.custom.map(c => ({ id: "c" + c.id, p: "perso", a: c.a, b: c.b })));

// Les civils doivent rester majoritaires : au plus (n - 1) / 2 imposteurs, Mr White compris.
function eff() {
  const m = Math.floor((S.players.length - 1) / 2);
  let u = S.nU, w = S.nW;
  if (u + w > m) { w = Math.max(0, m - u); if (u + w > m) u = m; }
  if (u + w === 0 && m > 0) u = 1;
  return { u, w, m };
}

// Comparaison tolérante pour la réponse de Mr White : sans accents, majuscules, articles ni pluriel.
function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()
    .replace(/^(le|la|les|l|un|une|des|du|de|d) /, "").replace(/(\w\w)[sx]$/, "$1");
}

// Vocabulaire selon le mode : « mon mot » ou « mon image ».
function voc(mode) {
  const img = (mode || (S.g ? S.g.mode : S.mode)) === "images";
  return img ? { mot: "image", mots: "images", le: "la", du: "de l'image", ce: "cette image", civ: "l'image des civils" }
    : { mot: "mot", mots: "mots", le: "le", du: "du mot", ce: "ce mot", civ: "le mot des civils" };
}

function head(stamp) {
  const back = S.screen === "setup" ? `<a class="back" href="../../">← Tous les jeux</a>` : "";
  return `<header class="head"><div class="head-l">${back}<div class="brand">Under<br><em>cover</em></div></div><div class="stamp">${esc(stamp)}</div></header>`;
}

function scoreList(delta) {
  const rows = S.players.map(p => ({ p, s: S.scores[p] || 0, d: delta ? delta[p] || 0 : null })).sort((a, b) => b.s - a.s);
  return `<ol class="scores">${rows.map((r, i) => `<li><span class="rk">${i + 1}</span><span class="nm">${esc(r.p)}</span><span class="dl">${r.d ? "+" + r.d : ""}</span><span class="pt">${r.s} pt${r.s > 1 ? "s" : ""}</span></li>`).join("")}</ol>`;
}

function secret(p) {
  const g = S.g, v = voc(), u = g.roles[p] === "u";
  if (g.roles[p] === "w") return `<section class="box"><div class="label">${esc(p)} · ton rôle</div><p class="word">Mr White</p>
    <p class="note">Tu n'as pas ${v.mot === "mot" ? "de mot" : "d'image"}. Écoute les autres, bluffe, et si tu es éliminé tu pourras tenter de deviner ${v.civ}.</p></section>`;
  const shown = g.mode === "images" ? `<p class="pic" role="img" aria-label="${esc(u ? g.undL : g.civL)}">${u ? g.und : g.civ}</p>`
    : `<p class="word">${esc(u ? g.und : g.civ)}</p>`;
  return `<section class="box"><div class="label">${esc(p)} · ton ${v.mot}</div>${shown}
    <p class="note">Retiens-${v.le} bien. Tu ne sais pas si tu es civil ou undercover.</p></section>`;
}

function passBox(p, note) {
  return `<section class="box pass"><div class="label">Passe le téléphone à</div><div class="pass-name">${esc(p)}</div><p class="note">${note}</p></section>`;
}

const V = {
  setup() {
    const n = S.players.length, e = eff(), canStart = n >= 3 && pool().length > 0, img = S.mode === "images";
    const hasScores = S.players.some(p => S.scores[p]);
    return `${head("Mission")}
    <section class="field">
      <div class="label">Les agents · ${n}/20</div>
      ${S.example ? `<p class="note">Noms d'exemple : ils disparaissent dès que vous ajoutez le premier vrai prénom.</p>` : ""}
      <div class="players">${S.players.map((p, i) => `<span class="chip"><span>${esc(p)}</span><button data-a="rm" data-i="${i}" aria-label="Retirer ${esc(p)}">×</button></span>`).join("") || `<p class="note">Aucun joueur pour l'instant.</p>`}</div>
      <form class="row" data-form="add">
        <input id="newp" type="text" maxlength="16" placeholder="Prénom ou surnom" autocomplete="off" aria-label="Prénom du joueur">
        <button class="btn" type="submit" ${n >= 20 ? "disabled" : ""}>Ajouter</button>
      </form>
      ${S.msg ? `<p class="err">${esc(S.msg)}</p>` : ""}
    </section>
    <section class="field">
      <div class="label">Mode de jeu</div>
      <div class="seg">${[["mots", "Mots"], ["images", "Images"]].map(([k, l]) => `<button data-a="mode" data-k="${k}" aria-pressed="${S.mode === k}">${l}</button>`).join("")}</div>
      <p class="note">${img ? `Chacun reçoit une image, l'undercover une image proche. ${IS.length} paires d'images.` : "Chacun reçoit un mot, l'undercover un mot proche."}</p>
    </section>
    <section class="field">
      <div class="label">Undercovers</div>
      <div class="seg">${[0, 1, 2, 3].map(k => `<button data-a="nu" data-k="${k}" aria-pressed="${e.u === k}" ${k > e.m || (k === 0 && e.w === 0) ? "disabled" : ""}>${k}</button>`).join("")}</div>
    </section>
    <section class="field">
      <div class="label">Mr White</div>
      <div class="seg">${[0, 1].map(k => `<button data-a="nw" data-k="${k}" aria-pressed="${e.w === k}" ${k === 1 && e.m < 1 ? "disabled" : ""}>${k ? "Avec" : "Sans"}</button>`).join("")}</div>
      <p class="note">${n >= 3 ? `${n - e.u - e.w} civil${n - e.u - e.w > 1 ? "s" : ""}, ${e.u} undercover${e.u > 1 ? "s" : ""}${e.w ? " et 1 Mr White" : ""}. ` : ""}Les civils doivent rester plus nombreux que les imposteurs.</p>
    </section>
    ${img ? "" : `<section class="field">
      <div class="label">Paquets de mots</div>
      <div class="seg">${Object.entries(PACKS).map(([k, v]) => `<button data-a="pack" data-k="${k}" aria-pressed="${!!S.packs[k]}">${v}<span class="count">${WS.filter(w => w.p === k).length}</span></button>`).join("")}</div>
    </section>`}
    <button class="btn big red" data-a="start" ${canStart ? "" : "disabled"}>Distribuer les ${img ? "images" : "mots"}</button>
    ${n < 3 ? `<p class="note center">Il faut au moins 3 joueurs.</p>` : !pool().length ? `<p class="note center">Activez au moins un paquet de mots.</p>` : ""}
    ${hasScores ? `<section class="box"><div class="label">Classement</div>${scoreList()}
      <button class="btn ghost quiet" data-a="reset">${S.arm === "reset" ? "Confirmer la remise à zéro" : "Remettre les scores à zéro"}</button></section>` : ""}
    ${img ? "" : `<details id="customBox" ${S.openCustom ? "open" : ""}>
      <summary>Vos paires de mots perso (${S.custom.length})</summary>
      <div class="dbody">
        <p class="note">Deux mots proches : l'un ira aux civils, l'autre aux undercovers. Elles entrent dans le tirage avec les paquets actifs.</p>
        <form class="stack" data-form="custom">
          <input id="ca" type="text" maxlength="40" placeholder="Premier mot : Lisbonne" aria-label="Premier mot">
          <input id="cb" type="text" maxlength="40" placeholder="Second mot : Barcelone" aria-label="Second mot">
          <button class="btn" type="submit">Ajouter la paire</button>
        </form>
        ${S.custom.length ? `<ul class="custom-list">${S.custom.map(c => `<li><div>${esc(c.a)}<small>${esc(c.b)}</small></div><button data-a="rmc" data-id="${c.id}" aria-label="Supprimer cette paire">×</button></li>`).join("")}</ul>` : ""}
      </div>
    </details>`}
    <details>
      <summary>Règles du jeu</summary>
      <div class="dbody">
        <ol>
          <li>Chacun découvre son mot en secret. Les civils ont tous le même. Les undercovers ont un mot proche, sans savoir qu'ils sont undercovers. Mr White n'a aucun mot, et lui le sait.</li>
          <li>À tour de rôle, chacun dit un seul mot ou une courte phrase qui évoque son mot, sans le dire.</li>
          <li>Débat, puis vote : le joueur éliminé révèle son rôle. Si c'est Mr White, il peut deviner le mot des civils pour gagner.</li>
          <li>On recommence jusqu'à la victoire d'un camp. Les civils gagnent quand tous les imposteurs sont éliminés. Les imposteurs gagnent s'il ne reste plus qu'un civil.</li>
        </ol>
        <p><strong>Mode Images :</strong> même principe avec des images. Chacun décrit son image sans la nommer, et Mr White doit deviner l'image des civils.</p>
        <p>Un joueur a oublié son mot ou son image ? Bouton « Revoir » pendant la partie.</p>
        <p><strong>Points :</strong> victoire des civils, 2 points par civil. Victoire des imposteurs, 10 points par undercover et 6 points pour Mr White s'il est encore en jeu. Mr White qui trouve le mot marque 6 points.</p>
      </div>
    </details>`;
  },
  pass() {
    const g = S.g, p = g.deal[g.idx];
    return `${head("Partie " + g.no)}
    <div class="field"><div class="label">Distribution ${g.idx + 1} sur ${g.deal.length}</div>
    <div class="steps">${g.deal.map((_, i) => `<i class="${i < g.idx ? "on" : ""}"></i>`).join("")}</div></div>
    ${passBox(p, "Les autres, regardez ailleurs.")}
    <button class="btn big" data-a="see">C'est moi, voir mon ${voc().mot}</button>
    <button class="btn ghost quiet" data-a="quit">${S.arm === "quit" ? "Confirmer l'abandon de la partie" : "Abandonner la partie"}</button>`;
  },
  word() {
    const g = S.g;
    return `${head("Top secret")}${secret(g.deal[g.idx])}
    <button class="btn big red" data-a="hide">J'ai retenu, cacher</button>`;
  },
  play() {
    const g = S.g, out = S.players.filter(p => !g.alive.includes(p));
    return `${head("Tour " + g.turn)}
    <section class="box"><div class="label">Ordre de parole</div>
      <p class="note">Chacun dit un mot ou une courte phrase qui évoque son ${voc().mot}, sans ${voc().le} nommer.</p>
      <ol class="order">${g.order.map(p => `<li>${esc(p)}</li>`).join("")}</ol></section>
    ${out.length ? `<section class="field"><div class="label">Éliminés</div>
      <div class="answers">${out.map(p => `<div class="ans"><span>${esc(p)}</span><strong>${ROLE[g.roles[p]]}</strong></div>`).join("")}</div></section>` : ""}
    <button class="btn big red" data-a="tovote">Passer au vote</button>
    <button class="btn ghost" data-a="peek">Revoir mon ${voc().mot}</button>
    <button class="btn ghost quiet" data-a="quit">${S.arm === "quit" ? "Confirmer l'abandon de la partie" : "Abandonner la partie"}</button>`;
  },
  vote() {
    const g = S.g;
    return `${head("Vote")}
    <section class="field"><div class="label">Qui éliminer ?</div>
      <p class="note">Débattez, votez, puis désignez le joueur éliminé.</p>
      <div class="pick">${g.alive.map(n => `<button data-a="sel" data-n="${esc(n)}" aria-pressed="${g.sel === n}">${esc(n)}</button>`).join("")}</div></section>
    <button class="btn big red" data-a="kill" ${g.sel ? "" : "disabled"}>${g.sel ? "Éliminer " + esc(g.sel) : "Choisissez un joueur"}</button>
    <button class="btn ghost" data-a="peek">Revoir mon ${voc().mot}</button>
    <button class="btn ghost quiet" data-a="toplay">Retour au tour</button>`;
  },
  out() {
    const g = S.g, p = g.out, r = g.roles[p], white = r === "w" && !g.guessed, v = voc();
    return `${head("Éliminé")}
    <p class="lead center">${esc(p)} était…</p>
    <div class="verdict-wrap"><div class="verdict">${ROLE[r]}</div></div>
    ${white && g.mode === "images" ? `<section class="box"><div class="label">Dernière chance</div>
      <p class="note">${esc(p)}, dis à voix haute ce que montre selon toi l'image des civils. Les civils jugent : si c'est la bonne, tu gagnes la partie.</p>
      <div class="row"><button class="btn red" data-a="wjudge" data-ok="1">Trouvé</button><button class="btn ghost" data-a="wjudge" data-ok="">Raté</button></div></section>`
    : white ? `<section class="box"><div class="label">Dernière chance</div>
      <p class="note">${esc(p)}, devine le mot des civils. Si c'est le bon, tu gagnes la partie.</p>
      <form class="stack" data-form="guess">
        <input id="guess" type="text" maxlength="40" placeholder="Le mot des civils" autocomplete="off" aria-label="Mot des civils">
        <button class="btn red" type="submit">Valider</button>
      </form></section>`
    : g.guessed ? `<p class="lead center">${g.guess ? `Raté, ce n'était pas « ${esc(g.guess)} ».` : "Raté."} La partie continue.</p>` : ""}
    ${white ? "" : g.winner ? `<button class="btn big red" data-a="toresult">Voir le résultat</button>` : `<button class="btn big red" data-a="next">Tour suivant</button>`}`;
  },
  peekpick() {
    return `${head("Trou de mémoire")}
    <section class="field"><div class="label">Qui veut revoir son ${voc().mot} ?</div>
      <div class="pick">${S.g.alive.map(n => `<button data-a="peekp" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div></section>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekpass() {
    return `${head("Trou de mémoire")}${passBox(S.g.peek, "Les autres, regardez ailleurs.")}
    <button class="btn big" data-a="peeksee">C'est moi, revoir mon ${voc().mot}</button>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekword() {
    return `${head("Top secret")}${secret(S.g.peek)}
    <button class="btn big red" data-a="peekx">J'ai retenu, cacher</button>`;
  },
  result() {
    const g = S.g;
    const title = g.winner === "c" ? "Civils" : g.winner === "w" ? "Mr White" : "Imposteurs";
    const line = g.winner === "c" ? "Tous les imposteurs ont été démasqués."
      : g.winner === "w" ? `${esc(g.out)} a trouvé ${voc().civ}.`
      : "Il ne reste plus qu'un civil : les imposteurs l'emportent.";
    return `${head("Fin de partie")}
    <div class="verdict-wrap"><div class="verdict">${title}</div></div>
    <p class="lead center">${line}</p>
    <section class="box"><div class="label">Les ${voc().mots}</div>
      <div class="answers">${[["Civils", g.civ, g.civL], ["Undercover", g.und, g.undL]].map(([k, w, l]) => `<div class="ans"><span>${k}</span><strong>${g.mode === "images" ? `<span class="pic-sm" aria-hidden="true">${w}</span> ${esc(l)}` : esc(w)}</strong></div>`).join("")}</div></section>
    <section class="field"><div class="label">Les rôles</div>
      <div class="answers">${S.players.map(p => `<div class="ans"><span>${esc(p)}${g.alive.includes(p) ? "" : ` <small class="note">éliminé</small>`}</span><strong>${ROLE[g.roles[p]]}</strong></div>`).join("")}</div></section>
    <section class="box"><div class="label">Classement après la partie ${g.no}</div>${scoreList(g.delta)}</section>
    <button class="btn big red" data-a="start">Nouvelle partie</button>
    <button class="btn ghost" data-a="menu">Retour au menu</button>`;
  }
};

function render(focusId) {
  app.innerHTML = V[S.screen]();
  if (S.screen !== lastScreen) { window.scrollTo(0, 0); lastScreen = S.screen; }
  if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
  save();
}

async function wake() {
  try { if ("wakeLock" in navigator && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } } catch (e) {}
}

// Ordre de parole aléatoire, Mr White ne commence jamais (sauf s'il ne reste que lui à pouvoir parler en premier).
function speakOrder() {
  const g = S.g, o = shuffle(g.alive), i = o.findIndex(p => g.roles[p] !== "w");
  if (i > 0) o.unshift(o.splice(i, 1)[0]);
  return o;
}

function newGame() {
  const all = pool(), e = eff(); if (S.players.length < 3 || !all.length) return;
  let fresh = all.filter(w => !S.used.includes(w.id));
  if (!fresh.length) { S.used = S.used.filter(id => !all.some(w => w.id === id)); fresh = all; }
  const w = fresh[rand(fresh.length)], flip = rand(2);
  S.used.push(w.id);
  const players = S.players.slice(), first = S.gameNo % players.length, roles = {};
  shuffle(players).forEach((p, i) => { roles[p] = i < e.u ? "u" : i < e.u + e.w ? "w" : "c"; });
  S.gameNo += 1;
  S.g = { no: S.gameNo, mode: S.mode, civ: flip ? w.b : w.a, und: flip ? w.a : w.b, civL: flip ? w.lb : w.la, undL: flip ? w.la : w.lb, roles,
    deal: players.slice(first).concat(players.slice(0, first)), idx: 0, alive: players, turn: 1, order: [],
    sel: null, out: null, guessed: false, guess: "", winner: null, delta: null, scored: false, peek: null, peekBack: null };
  S.g.order = speakOrder();
  S.screen = "pass"; S.arm = ""; S.msg = "";
  wake(); render();
}

function checkWin() {
  const g = S.g, civ = g.alive.filter(p => g.roles[p] === "c").length, imp = g.alive.length - civ;
  if (!imp) g.winner = "c";
  else if (civ <= 1) g.winner = "i";
}

function scoreGame() {
  const g = S.g; if (g.scored) return;
  g.delta = {};
  S.players.forEach(p => {
    const r = g.roles[p];
    const d = g.winner === "c" ? (r === "c" ? PTS.c : 0)
      : g.winner === "w" ? (p === g.out ? PTS.w : 0)
      : r === "u" ? PTS.u : r === "w" && g.alive.includes(p) ? PTS.w : 0;
    g.delta[p] = d; S.scores[p] = (S.scores[p] || 0) + d;
  });
  g.scored = true;
}

app.addEventListener("click", e => {
  const b = e.target.closest("[data-a]"); if (!b || b.disabled) return;
  const a = b.dataset.a, g = S.g;
  if (a !== "reset" && a !== "quit") S.arm = "";
  switch (a) {
    case "rm": S.players.splice(+b.dataset.i, 1); S.example = false; S.msg = ""; return render();
    case "nu": S.nU = +b.dataset.k; if (S.nU + S.nW > eff().m) S.nW = 0; return render();
    case "nw": S.nW = +b.dataset.k; if (S.nW && S.nU + 1 > eff().m) S.nU = Math.max(0, eff().m - 1); if (!S.nW && !S.nU) S.nU = 1; return render();
    case "mode": S.mode = b.dataset.k; return render();
    case "pack": S.packs[b.dataset.k] = !S.packs[b.dataset.k]; return render();
    case "start": return newGame();
    case "reset":
      if (S.arm === "reset") { S.scores = {}; S.gameNo = 0; S.arm = ""; } else S.arm = "reset";
      return render();
    case "rmc": S.openCustom = true; S.custom = S.custom.filter(c => String(c.id) !== b.dataset.id); S.used = S.used.filter(id => id !== "c" + b.dataset.id); return render();
    case "quit":
      if (S.arm === "quit") { S.arm = ""; S.g = null; S.screen = "setup"; } else S.arm = "quit";
      return render();
    case "see": S.screen = "word"; return render();
    case "hide": g.idx += 1; S.screen = g.idx < g.deal.length ? "pass" : "play"; return render();
    case "tovote": S.screen = "vote"; return render();
    case "toplay": S.screen = "play"; return render();
    case "sel": g.sel = b.dataset.n; return render();
    case "kill":
      g.out = g.sel; g.sel = null; g.guessed = false; g.guess = "";
      g.alive = g.alive.filter(p => p !== g.out);
      if (g.roles[g.out] !== "w") checkWin();
      S.screen = "out"; return render(g.roles[g.out] === "w" ? "guess" : null);
    case "wjudge":
      g.guessed = true; g.guess = "";
      if (b.dataset.ok) { g.winner = "w"; scoreGame(); S.screen = "result"; } else checkWin();
      return render();
    case "next": g.turn += 1; g.order = speakOrder(); S.screen = "play"; return render();
    case "toresult": scoreGame(); S.screen = "result"; return render();
    case "peek": g.peekBack = S.screen; S.screen = "peekpick"; return render();
    case "peekp": g.peek = b.dataset.n; S.screen = "peekpass"; return render();
    case "peeksee": S.screen = "peekword"; return render();
    case "peekx": g.peek = null; S.screen = g.peekBack || "play"; return render();
    case "menu": S.g = null; S.screen = "setup"; return render();
  }
});

app.addEventListener("toggle", e => { if (e.target.id === "customBox") S.openCustom = e.target.open; }, true);

app.addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target.dataset.form;
  if (f === "add") {
    const v = document.getElementById("newp").value.trim().replace(/\s+/g, " ");
    if (!v) return;
    if (S.example) { S.players = []; S.example = false; }
    if (S.players.some(p => p.toLowerCase() === v.toLowerCase())) { S.msg = `${v} est déjà dans la liste.`; return render("newp"); }
    if (S.players.length >= 20) { S.msg = "20 joueurs maximum."; return render("newp"); }
    S.players.push(v); S.msg = ""; render("newp");
  } else if (f === "custom") {
    const a = document.getElementById("ca").value.trim(), b = document.getElementById("cb").value.trim();
    if (!a || !b) { document.getElementById(a ? "cb" : "ca").focus(); return; }
    S.custom.push({ id: Date.now(), a, b });
    S.openCustom = true; render("ca");
  } else if (f === "guess") {
    const v = document.getElementById("guess").value.trim(), g = S.g;
    if (!v) return;
    g.guessed = true; g.guess = v;
    if (norm(v) === norm(g.civ)) { g.winner = "w"; scoreGame(); S.screen = "result"; return render(); }
    checkWin(); render();
  }
});

function start(data) {
  if (data && data.S) S = data.S;
  else {
    S = defaults();
    const saved = load(KEY);
    if (saved) { Object.assign(S, saved); S.example = false; }
    else {
      // Première visite : reprend les joueurs du Quiz Undercover s'il y en a.
      const quiz = load("jeux.quiz-undercover.v1");
      if (quiz && quiz.players && quiz.players.length) { S.players = quiz.players.slice(0, 20); S.example = false; }
    }
    // Ne jamais rouvrir l'application sur un mot affiché.
    if (!S.g) S.screen = "setup";
    else if (S.screen === "word") S.screen = "pass";
    else if (S.screen === "peekword" || S.screen === "peekpass") S.screen = "peekpick";
  }
  render();
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
