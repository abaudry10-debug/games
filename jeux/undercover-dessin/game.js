// Undercover Dessin : chacun ajoute un trait au même dessin ; l'imposteur n'a pas le même mot (ou n'en a pas).
// Les mots viennent de l'Undercover (../undercover/mots.js).
const KEY = "jeux.undercover-dessin.v1";
const COLORS = ["#E4572E", "#2E86AB", "#3BB273", "#F4B400", "#8E44AD", "#E91E63", "#00ACC1", "#795548", "#FF7F11", "#37474F"];
const theme = t => Paquets.themeLabel(t);
const app = document.getElementById("app");
let S, lastScreen = null, lock = null;

function defaults() {
  return { screen: "setup", players: ["Léa", "Tom", "Sam", "Inès"], example: true, packs: { classique: true, soiree: false, culture: false },
    sim: 4, nU: 1, nW: 0, tours: 2, scores: {}, used: [], roundNo: 0, g: null, msg: "", arm: "" };
}
function load() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ players: S.players, packs: S.packs, sim: S.sim, nU: S.nU, nW: S.nW, tours: S.tours, recent: S.recent,
    scores: S.scores, used: S.used, roundNo: S.roundNo, g: S.g, screen: S.screen })); } catch (e) {}
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const isActive = id => S.packs[id] !== false;
const canPlay = () => Paquets.count(isActive) >= 2;
const ROLE = { c: "Civil", u: "Undercover", w: "Mr White" };
// Les civils doivent rester majoritaires : au plus (n - 1) / 2 imposteurs (undercovers et Mr White).
function eff() {
  const m = Math.floor((S.players.length - 1) / 2);
  let u = S.nU, w = S.nW;
  if (u + w > m) { w = Math.max(0, m - u); if (u + w > m) u = m; }
  if (u + w === 0 && m > 0) u = 1;
  return { u, w, m };
}
const color = p => COLORS[S.players.indexOf(p) % COLORS.length];
const dot = p => `<i class="dot" style="background:${color(p)}"></i>`;

function head(stamp) {
  const back = S.screen === "setup" ? `<a class="back" href="../../">← Tous les jeux</a>` : "";
  return `<header class="head"><div class="head-l">${back}<div class="brand">Undercover<br><em>Dessin</em></div></div><div class="head-r">${S.screen === "setup" ? fx.soundButton() : `<div class="stamp">${esc(stamp)}</div>`}</div></header>`;
}
function scoreList(delta) {
  const rows = S.players.map(p => ({ p, s: S.scores[p] || 0, d: delta ? delta[p] || 0 : null })).sort((a, b) => b.s - a.s);
  return `<ol class="scores">${rows.map((r, i) => `<li><span class="rk">${i + 1}</span><span class="nm">${esc(r.p)}</span><span class="dl">${r.d ? "+" + r.d : ""}</span><span class="pt">${r.s} pt${r.s > 1 ? "s" : ""}</span></li>`).join("")}</ol>`;
}
function secret(p) {
  const g = S.g, r = g.roles[p];
  if (r === "w") return `<section class="box"><div class="label">${esc(p)} · ton rôle</div><p class="word">Mr White</p>
    <p class="theme">Thème : ${esc(theme(g.cat))}</p><p class="note">Tu n'as pas de mot. Dessine comme si tu savais, et devine le mot des autres.</p></section>`;
  return `<section class="box"><div class="label">${esc(p)} · ton mot</div><p class="word">${esc(r === "u" ? g.und : g.civ)}</p>
    ${g.und ? `<p class="note">Retiens-le. Tu ne sais pas si tu es l'undercover.</p>` : ""}</section>`;
}
const board = (hint = "") => `<div class="board" id="board"><canvas id="cv"></canvas>${hint ? `<div class="hint">${hint}</div>` : ""}</div>`;
const legend = () => `<div class="legend">${S.players.map(p => `<span>${dot(p)}${esc(p)}</span>`).join("")}</div>`;
const passBox = p => `<section class="box pass"><div class="label">Passe le téléphone à</div><div class="pass-name">${esc(p)}</div><p class="note">Les autres, regardez ailleurs.</p></section>`;

const V = {
  setup() {
    const n = S.players.length, e = eff(), canStart = n >= 3 && canPlay(), hasScores = S.players.some(p => S.scores[p]);
    return `${head("Atelier")}
    <section class="field">
      <div class="label">Joueurs · ${n}</div>
      <div class="players">${S.players.map((p, i) => `<span class="chip${S.example ? " ex" : ""}">${dot(p)}<span>${esc(p)}</span><button data-a="rm" data-i="${i}" aria-label="Retirer ${esc(p)}">×</button></span>`).join("")}</div>
      <form class="row" data-form="add">
        <input id="newp" type="text" maxlength="16" placeholder="Ajouter un joueur" autocomplete="off" aria-label="Prénom du joueur">
        <button class="btn" type="submit" aria-label="Ajouter le joueur" ${n >= 10 ? "disabled" : ""}>+</button>
      </form>
      ${S.msg ? `<p class="err">${esc(S.msg)}</p>` : ""}
    </section>
    <details id="setBox" class="settings" ${S.openSet ? "open" : ""}>
      <summary>Réglages<span class="sum">${e.u} undercover${e.u > 1 ? "s" : ""} · ${e.w} Mr White · ${S.tours} trait${S.tours > 1 ? "s" : ""}${e.u ? " · " + simName(S.sim) : ""}</span></summary>
      <div class="dbody">
        <section class="field">
          <div class="label">Undercovers</div>
          <div class="seg">${[0, 1, 2, 3].map(k => `<button data-a="nu" data-k="${k}" aria-pressed="${e.u === k}" ${k > e.m || (k === 0 && e.w === 0) ? "disabled" : ""}>${k}</button>`).join("")}</div>
          <p class="note">Mot proche, sans savoir qu'ils sont undercovers.</p>
        </section>
        <section class="field">
          <div class="label">Mr White</div>
          <div class="seg">${[0, 1, 2, 3].map(k => `<button data-a="nw" data-k="${k}" aria-pressed="${e.w === k}" ${k > e.m || (k === 0 && e.u === 0) ? "disabled" : ""}>${k}</button>`).join("")}</div>
          <p class="note">Aucun mot, seulement le thème.</p>
        </section>
        <section class="field">
          <div class="label">Tours de dessin</div>
          <div class="seg">${[1, 2, 3].map(k => `<button data-a="tours" data-k="${k}" aria-pressed="${S.tours === k}">${k} trait${k > 1 ? "s" : ""} chacun</button>`).join("")}</div>
        </section>
        <section class="field">
          <div class="label">Paquets</div>
          ${Paquets.selector(isActive)}
        </section>
        ${e.u ? simPicker(S.sim, "mots") : ""}
      </div>
    </details>
    <button class="btn big red" data-a="start" ${canStart ? "" : "disabled"}>Jouer</button>
    ${n < 3 ? `<p class="note center">Au moins 3 joueurs.</p>` : !canPlay() ? `<p class="note center">Activez au moins un paquet.</p>` : ""}
    ${hasScores ? `<details><summary>Classement</summary><div class="dbody">${scoreList()}
      <button class="btn ghost quiet" data-a="reset">${S.arm === "reset" ? "Confirmer la remise à zéro" : "Remettre à zéro"}</button></div></details>` : ""}
    <details id="packBox" ${S.openPacks ? "open" : ""}>
      <summary>Paquets</summary>
      <div class="dbody">${Paquets.manager()}</div>
    </details>
    <details>
      <summary>Règles du jeu</summary>
      <div class="dbody">
        <ol>
          <li>Chacun découvre son mot en secret. Les undercovers ont un mot proche sans le savoir. Les Mr White n'ont aucun mot, seulement le thème.</li>
          <li>À tour de rôle, chacun ajoute un seul trait au dessin, sans lever le doigt.</li>
          <li>Ensuite, on vote pour désigner l'imposteur.</li>
          <li>Imposteur démasqué : il peut encore se rattraper s'il devine le mot des civils.</li>
        </ol>
        <p><strong>Points :</strong> chaque imposteur pas démasqué, +2. Démasqué mais il trouve le mot, +1 pour lui. Démasqué et raté, +1 pour chaque civil.</p>
      </div>
    </details>`;
  },
  pass() {
    const g = S.g, p = g.deal[g.idx];
    return `${head("Manche " + g.no)}
    <div class="field"><div class="label">Distribution ${g.idx + 1} sur ${g.deal.length}</div>
    <div class="steps">${g.deal.map((_, i) => `<i class="${i < g.idx ? "on" : ""}"></i>`).join("")}</div></div>
    ${passBox(p)}
    <button class="btn big" data-a="see">C'est moi, voir mon mot</button>
    ${g.idx ? `<button class="btn ghost" data-a="peek">Revoir mon mot</button>` : ""}
    <button class="btn ghost quiet" data-a="quit">${S.arm === "quit" ? "Confirmer l'abandon" : "Abandonner la manche"}</button>`;
  },
  word() {
    return `${head("Top secret")}${secret(S.g.deal[S.g.idx])}
    <button class="btn big red" data-a="hide">J'ai retenu, cacher</button>`;
  },
  draw() {
    const g = S.g, p = g.order[g.turn], done = !!g.pending;
    return `${head(`Trait ${g.turn + 1}/${g.order.length}`)}
    <div class="who">${dot(p)}<div class="pass-name">${esc(p)}</div></div>
    ${board(done ? "" : "Un seul trait, sans lever le doigt")}
    <div class="queue">${g.order.map((q, i) => `<i class="${i < g.turn ? "done" : i === g.turn ? "now" : ""}" style="background:${color(q)}"></i>`).join("")}</div>
    <button class="btn big red" data-a="valid" ${done ? "" : "disabled"}>${g.turn + 1 < g.order.length ? "Valider mon trait" : "Valider et passer au vote"}</button>
    <div class="row"><button class="btn ghost" data-a="undo" ${done ? "" : "disabled"}>Effacer mon trait</button><button class="btn ghost" data-a="peek">Revoir mon mot</button></div>
    <button class="btn ghost quiet" data-a="quit">${S.arm === "quit" ? "Confirmer l'abandon" : "Abandonner la manche"}</button>`;
  },
  vote() {
    const g = S.g;
    return `${head("Vote")}
    <div class="mini">${board()}</div>${legend()}
    <section class="field"><div class="label">Qui est l'imposteur ?</div>
      <div class="pick">${S.players.map(n => `<button data-a="acc" data-n="${esc(n)}" aria-pressed="${g.accused === n}">${esc(n)}</button>`).join("")}</div></section>
    <button class="btn big red" data-a="judge" ${g.accused ? "" : "disabled"}>${g.accused ? "Accuser " + esc(g.accused) : "Choisissez un suspect"}</button>
    <button class="btn ghost" data-a="peek">Revoir mon mot</button>`;
  },
  guess() {
    const g = S.g, p = g.accused, r = g.roles[p];
    return `${head("Démasqué")}
    <div class="verdict-wrap"><div class="verdict">${ROLE[r]}</div></div>
    <p class="lead center">${esc(p)} était bien ${r === "w" ? "Mr White" : `undercover (son mot : « ${esc(g.und)} »)`}.</p>
    <section class="box"><div class="label">Dernière chance</div>
      <p class="note">${esc(p)}, dis à voix haute le mot des autres. Les autres jugent.</p>
      <div class="row"><button class="btn red" data-a="found" data-ok="1">Trouvé</button><button class="btn ghost" data-a="found" data-ok="">Raté</button></div></section>`;
  },
  result() {
    const g = S.g, caught = g.imps.includes(g.accused), p = g.accused;
    const title = !caught ? "Raté" : g.found ? "Rattrapé" : "Démasqué";
    const others = g.imps.filter(x => x !== p).map(x => `${esc(x)} (${ROLE[g.roles[x]]})`);
    const line = !caught ? `${esc(p)} était innocent. Imposteur${g.imps.length > 1 ? "s" : ""} : ${g.imps.map(x => `${esc(x)} (${ROLE[g.roles[x]]})`).join(", ")}.`
      : (g.found ? `${esc(p)} a été démasqué… mais a trouvé le mot.` : `${esc(p)} a été démasqué et n'a pas trouvé le mot.`) + (others.length ? ` ${others.join(", ")} s'en sort${others.length > 1 ? "ent" : ""}.` : "");
    return `${head("Verdict")}
    <div class="verdict-wrap"><div class="verdict">${title}</div></div>
    <p class="lead center">${line}</p>
    <section class="box"><div class="label">Les mots</div><div class="answers">
      <div class="ans"><span>Civils</span><strong>${esc(g.civ)}</strong></div>
      ${g.und ? `<div class="ans"><span>Undercover</span><strong>${esc(g.und)}</strong></div>` : ""}
      ${g.imps.some(x => g.roles[x] === "w") ? `<div class="ans"><span>Mr White</span><strong>Aucun mot</strong></div>` : ""}</div></section>
    ${board()}${legend()}
    <button class="btn ghost" data-a="dl">Enregistrer le dessin</button>
    <section class="box"><div class="label">Classement après la manche ${g.no}</div>${scoreList(g.delta)}</section>
    <button class="btn big red" data-a="start">Manche suivante</button>
    <button class="btn ghost" data-a="menu">Retour au menu</button>`;
  },
  peekpick() {
    const g = S.g, who = g.peekBack === "pass" ? g.deal.slice(0, g.idx) : S.players;
    return `${head("Trou de mémoire")}
    <section class="field"><div class="label">Qui veut revoir son mot ?</div>
      <div class="pick">${who.map(n => `<button data-a="peekp" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div></section>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekpass() {
    return `${head("Trou de mémoire")}${passBox(S.g.peek)}
    <button class="btn big" data-a="peeksee">C'est moi, revoir mon mot</button>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekword() {
    return `${head("Top secret")}${secret(S.g.peek)}
    <button class="btn big red" data-a="peekx">J'ai retenu, cacher</button>`;
  }
};

// Dessin : les traits sont gardés en coordonnées 0–1, puis redessinés à la taille du canevas.
function paint(cv) {
  const g = S.g, dpr = window.devicePixelRatio || 1, w = cv.clientWidth;
  cv.width = cv.height = Math.round(w * dpr);
  const c = cv.getContext("2d"), size = cv.width;
  c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, size, size);
  c.lineCap = c.lineJoin = "round"; c.lineWidth = size * .014;
  const all = g.strokes.concat(g.pending ? [{ p: g.order[g.turn], pts: g.pending }] : []);
  for (const s of all) {
    c.strokeStyle = c.fillStyle = color(s.p);
    if (s.pts.length === 1) { c.beginPath(); c.arc(s.pts[0][0] * size, s.pts[0][1] * size, c.lineWidth / 2, 0, 7); c.fill(); continue; }
    c.beginPath(); s.pts.forEach(([x, y], i) => (i ? c.lineTo(x * size, y * size) : c.moveTo(x * size, y * size))); c.stroke();
  }
}
function setupBoard() {
  const cv = document.getElementById("cv"); if (!cv) return;
  paint(cv);
  if (S.screen !== "draw") { document.getElementById("board").classList.add("locked"); return; }
  const g = S.g; let pts = null;
  const at = e => { const r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  cv.addEventListener("pointerdown", e => {
    if (g.pending) return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId); pts = [at(e)];
    const hint = document.querySelector(".board .hint"); if (hint) hint.remove();
  });
  cv.addEventListener("pointermove", e => {
    if (!pts) return;
    const p = at(e), q = pts[pts.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) < .004) return;
    pts.push(p); g.pending = pts; paint(cv); g.pending = null;
  });
  const end = () => {
    if (!pts) return;
    g.pending = pts.map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]); pts = null;
    fx.sound("tick"); render();
  };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
}

function render(focusId) {
  app.innerHTML = V[S.screen]();
  if (S.screen !== lastScreen) {
    window.scrollTo(0, 0); lastScreen = S.screen; fx.enter(app);
    fx.buzz({ word: 15, peekword: 15, guess: 60, result: [40, 60, 90] }[S.screen]);
    fx.sound(S.screen === "result" ? (S.g.imps.includes(S.g.accused) && !S.g.found ? "win" : "fail") : { word: "reveal", peekword: "reveal", guess: "elim" }[S.screen]);
  }
  setupBoard();
  if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
  save();
}
window.addEventListener("resize", () => { const cv = document.getElementById("cv"); if (cv && S.g) paint(cv); });

async function wake() {
  try { if ("wakeLock" in navigator && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } } catch (e) {}
}

function newRound() {
  if (S.players.length < 3 || !canPlay()) return;
  const players = S.players.slice(), first = S.roundNo % players.length;
  const e = eff(), w = Paquets.pick(isActive, e.u ? S.sim : 4, S.recent || []), flip = rand(2);
  if (!w) return;
  S.recent = [w.na, w.nb].concat(S.recent || []).slice(0, 80);
  const civ = flip ? w.b : w.a, und = e.u ? (flip ? w.a : w.b) : null, cat = flip ? w.themeB : w.theme;
  S.roundNo += 1;
  const roles = {};
  shuffle(players).forEach((p, i) => { roles[p] = i < e.u ? "u" : i < e.u + e.w ? "w" : "c"; });
  const imps = players.filter(p => roles[p] !== "c");
  // Ordre de dessin : un Mr White ne commence jamais.
  const base = shuffle(players), k = base.findIndex(p => roles[p] !== "w");
  if (k > 0) base.unshift(base.splice(k, 1)[0]);
  S.g = { no: S.roundNo, civ, und, cat, roles, imps, deal: players.slice(first).concat(players.slice(0, first)), idx: 0,
    order: Array.from({ length: S.tours }, () => base).flat(), turn: 0, strokes: [], pending: null,
    accused: null, found: false, scored: false, delta: null, peek: null, peekBack: null };
  S.screen = "pass"; S.arm = ""; S.msg = "";
  wake(); render();
}

function scoreRound() {
  const g = S.g; if (g.scored) return;
  const caught = g.imps.includes(g.accused); g.delta = {};
  S.players.forEach(p => {
    const imp = g.imps.includes(p);
    const d = !imp ? (caught && !g.found ? 1 : 0) : p !== g.accused ? 2 : g.found ? 1 : 0;
    g.delta[p] = d; S.scores[p] = (S.scores[p] || 0) + d;
  });
  g.scored = true;
}

function download() {
  const cv = document.getElementById("cv"); if (!cv) return;
  const a = document.createElement("a");
  a.download = `undercover-dessin-${S.g.civ.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.png`;
  a.href = cv.toDataURL("image/png"); a.click();
}

app.addEventListener("click", e => {
  const pk = e.target.closest("[data-pk]");
  if (pk) { if (Paquets.handle(pk)) render(); return; }
  const b = e.target.closest("[data-a]"); if (!b || b.disabled) return;
  const a = b.dataset.a, g = S.g;
  if (a !== "reset" && a !== "quit") S.arm = "";
  switch (a) {
    case "rm": S.players.splice(+b.dataset.i, 1); S.example = false; S.msg = ""; return render();
    case "nu": S.nU = +b.dataset.k; if (S.nU + S.nW > eff().m) S.nW = Math.max(0, eff().m - S.nU); if (!S.nW && !S.nU) S.nU = 1; return render();
    case "nw": S.nW = +b.dataset.k; if (S.nU + S.nW > eff().m) S.nU = Math.max(0, eff().m - S.nW); if (!S.nW && !S.nU) S.nU = 1; return render();
    case "sim": S.sim = +b.dataset.k; return render();
    case "tours": S.tours = +b.dataset.k; return render();
    case "pack": S.packs[b.dataset.k] = !isActive(b.dataset.k); return render();
    case "start": return newRound();
    case "reset": if (S.arm === "reset") { S.scores = {}; S.roundNo = 0; S.arm = ""; } else S.arm = "reset"; return render();
    case "quit": if (S.arm === "quit") { S.arm = ""; S.g = null; S.screen = "setup"; } else S.arm = "quit"; return render();
    case "see": S.screen = "word"; return render();
    case "hide": g.idx += 1; S.screen = g.idx < g.deal.length ? "pass" : "draw"; return render();
    case "undo": g.pending = null; return render();
    case "valid":
      g.strokes.push({ p: g.order[g.turn], pts: g.pending }); g.pending = null; g.turn += 1;
      if (g.turn >= g.order.length) S.screen = "vote";
      return render();
    case "acc": g.accused = b.dataset.n; return render();
    case "judge":
      if (g.imps.includes(g.accused)) { S.screen = "guess"; return render(); }
      scoreRound(); S.screen = "result"; return render();
    case "found": g.found = !!b.dataset.ok; scoreRound(); S.screen = "result"; return render();
    case "dl": return download();
    case "menu": S.g = null; S.screen = "setup"; return render();
    case "peek": g.peekBack = S.screen; S.screen = "peekpick"; return render();
    case "peekp": g.peek = b.dataset.n; S.screen = "peekpass"; return render();
    case "peeksee": S.screen = "peekword"; return render();
    case "peekx": g.peek = null; S.screen = g.peekBack || "draw"; return render();
  }
});

app.addEventListener("toggle", e => {
  if (e.target.id === "setBox") S.openSet = e.target.open;
  if (e.target.id === "packBox") S.openPacks = e.target.open;
}, true);

app.addEventListener("submit", e => {
  e.preventDefault();
  const focus = Paquets.submit(e.target);
  if (focus) return render(focus);
  if (e.target.dataset.form !== "add") return;
  const v = document.getElementById("newp").value.trim().replace(/\s+/g, " ");
  if (!v) return;
  if (S.example) { S.players = []; S.example = false; }
  if (S.players.some(p => p.toLowerCase() === v.toLowerCase())) { S.msg = `${v} est déjà dans la liste.`; return render("newp"); }
  if (S.players.length >= 10) { S.msg = "10 joueurs maximum."; return render("newp"); }
  S.players.push(v); S.msg = ""; render("newp");
});

function start(data) {
  if (data && data.S) S = data.S;
  else {
    S = defaults();
    const saved = load();
    if (saved) {
      Object.assign(S, saved); S.example = false;
      if (saved.imp && saved.nU === undefined) { S.nU = saved.imp === "aucun" ? 0 : 1; S.nW = saved.imp === "aucun" ? 1 : 0; }
      delete S.imp;
      if (S.g && !S.g.roles) S.g = null;
    }
    else {
      // Première visite : reprend les joueurs de l'Undercover s'il y en a.
      const uc = (() => { try { return JSON.parse(localStorage.getItem("jeux.undercover.v1") || "null"); } catch (e) { return null; } })();
      if (uc && uc.players && uc.players.length) { S.players = uc.players.slice(0, 10); S.example = false; }
    }
    if (!S.g) S.screen = "setup";
    else if (S.screen === "word") S.screen = "pass";
    else if (S.screen === "peekword" || S.screen === "peekpass") S.screen = "peekpick";
    if (S.g) S.g.pending = null;
  }
  render();
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
