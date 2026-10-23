const QS = Q.map((q, i) => ({ id: "q" + (i + 1), p: q[0], c: q[1], v: { 5: q[2], 4: q[3], 3: q[4] } }));
const KEY = "jeux.quiz-undercover.v1";
const app = document.getElementById("app");
let S, tick = null, lastScreen = null, lock = null;

function defaults() {
  return { screen: "setup", players: ["Léa", "Tom", "Sam", "Inès"], example: true,
    packs: { classique: true, soiree: true, epice: false }, nImp: 1, sim: 4, custom: [],
    scores: {}, used: [], roundNo: 0, round: null, timerEnd: null, msg: "", arm: "" };
}
function load() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ players: S.players, packs: S.packs, nImp: S.nImp, sim: S.sim, custom: S.custom, scores: S.scores, used: S.used, roundNo: S.roundNo })); } catch (e) {}
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const effImp = () => (S.players.length >= 6 ? S.nImp : 1);
const pool = () => QS.filter(q => S.packs[q.p]).concat(S.custom.map(c => ({ id: "c" + c.id, p: "perso", c: c.c, v: { 5: c.i, 4: c.i, 3: c.i } })));

// Question de l'imposteur selon le taux de ressemblance.
// 3 à 5 : variante écrite pour ce niveau ; 2 : une autre question du même paquet ; 1 : une question d'un autre paquet.
function impostorQuestion(q, all) {
  const lvl = S.sim;
  if (lvl >= 3) return q.v[lvl];
  const others = all.concat(QS).filter(o => o.c !== q.c);
  let pick = others.filter(o => (lvl === 2 ? o.p === q.p : o.p !== q.p));
  if (!pick.length) pick = others;
  return pick.length ? pick[rand(pick.length)].c : q.v[3];
}
const qno = q => (q.id[0] === "q" ? "n° " + q.id.slice(1) : "perso");

function head(stamp) {
  const back = S.screen === "setup" ? `<a class="back" href="../../">← Tous les jeux</a>` : "";
  return `<header class="head"><div class="head-l">${back}<div class="brand">Quiz<br><em>Undercover</em></div></div><div class="head-r">${S.screen === "setup" ? fx.soundButton() : `<div class="stamp">${esc(stamp)}</div>`}</div></header>`;
}

function scoreList(delta) {
  const rows = S.players.map(p => ({ p, s: S.scores[p] || 0, d: delta ? delta[p] || 0 : null })).sort((a, b) => b.s - a.s);
  return `<ol class="scores">${rows.map((r, i) => `<li><span class="rk">${i + 1}</span><span class="nm">${esc(r.p)}</span><span class="dl">${r.d ? "+" + r.d : ""}</span><span class="pt">${r.s} pt${r.s > 1 ? "s" : ""}</span></li>`).join("")}</ol>`;
}

// Question masquée par défaut : floutée sous un tampon « Confidentiel », on choisit de l'afficher ou de jouer seulement avec les votes.
const LOCK = `<svg class="veil-lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none"/></svg>`;
function veiled(label, inner, note, final) {
  const r = S.round, open = r.showQ, anim = r.anim;
  r.anim = false;
  return `<section class="box"><div class="label">${label}</div>
    <div class="veil${open ? " open" : ""}${anim ? " anim" : ""}">
      <div class="veil-body"${open ? "" : ` aria-hidden="true"`}>${inner}</div>
      ${open ? "" : `<div class="veil-cover">${LOCK}<span class="veil-stamp">Confidentiel</span>
        <button class="btn red" data-a="showq">${final ? "Afficher les questions" : "Afficher la question"}</button>
        ${final ? "" : `<span class="veil-hint">ou jouez seulement avec les votes</span>`}</div>`}
    </div>
    ${note ? `<p class="note">${note}</p>` : ""}
    ${open ? `<button class="btn ghost quiet" data-a="hideq">${final ? "Masquer les questions" : "Masquer la question"}</button>` : ""}</section>`;
}

const V = {
  setup() {
    const n = S.players.length, canStart = n >= 3 && pool().length > 0;
    const hasScores = S.players.some(p => S.scores[p]);
    return `${head("Dossier ouvert")}
    <section class="field">
      <div class="label">Joueurs · ${n}</div>
      <div class="players">${S.players.map((p, i) => `<span class="chip${S.example ? " ex" : ""}"><span>${esc(p)}</span><button data-a="rm" data-i="${i}" aria-label="Retirer ${esc(p)}">×</button></span>`).join("")}</div>
      <form class="row" data-form="add">
        <input id="newp" type="text" maxlength="16" placeholder="Ajouter un joueur" autocomplete="off" aria-label="Prénom du joueur">
        <button class="btn" type="submit" aria-label="Ajouter" ${n >= 12 ? "disabled" : ""}>+</button>
      </form>
      ${S.msg ? `<p class="err">${esc(S.msg)}</p>` : ""}
    </section>
    <details id="setBox" class="settings" ${S.openSet ? "open" : ""}>
      <summary>Réglages<span class="sum">${effImp()} imposteur${effImp() > 1 ? "s" : ""} · ${simName(S.sim)}</span></summary>
      <div class="dbody">
        <section class="field">
          <div class="label">Imposteurs</div>
          <div class="seg">${[1, 2].map(k => `<button data-a="imp" data-k="${k}" aria-pressed="${effImp() === k}" ${k === 2 && n < 6 ? "disabled" : ""}>${k}</button>`).join("")}</div>
          ${n < 6 ? `<p class="note">2 imposteurs dès 6 joueurs.</p>` : ""}
        </section>
        <section class="field">
          <div class="label">Paquets</div>
          <div class="seg">${Object.entries(PACKS).map(([k, v]) => `<button data-a="pack" data-k="${k}" aria-pressed="${!!S.packs[k]}">${v}<span class="count">${QS.filter(q => q.p === k).length}</span></button>`).join("")}</div>
        </section>
        ${simPicker(S.sim, "questions")}
      </div>
    </details>
    <button class="btn big red" data-a="start" ${canStart ? "" : "disabled"}>Jouer</button>
    ${n < 3 ? `<p class="note center">Au moins 3 joueurs.</p>` : !pool().length ? `<p class="note center">Activez au moins un paquet.</p>` : ""}
    ${hasScores ? `<details><summary>Classement</summary><div class="dbody">${scoreList()}
      <button class="btn ghost quiet" data-a="reset">${S.arm === "reset" ? "Confirmer la remise à zéro" : "Remettre à zéro"}</button></div></details>` : ""}
    <details id="customBox" ${S.openCustom ? "open" : ""}>
      <summary>Questions perso<span class="count">${S.custom.length || ""}</span></summary>
      <div class="dbody">
        <form class="stack" data-form="custom">
          <input id="cc" type="text" maxlength="120" placeholder="Question de l'équipe : Qui a perdu son passeport à Lisbonne ?" aria-label="Question de l'équipe">
          <input id="ci" type="text" maxlength="120" placeholder="Question de l'imposteur : Qui a le mieux géré le voyage ?" aria-label="Question de l'imposteur">
          <button class="btn" type="submit">Ajouter la question</button>
        </form>
        ${S.custom.length ? `<ul class="custom-list">${S.custom.map(c => `<li><div>${esc(c.c)}<small>Imposteur : ${esc(c.i)}</small></div><button data-a="rmc" data-id="${c.id}" aria-label="Supprimer cette question">×</button></li>`).join("")}</ul>` : ""}
      </div>
    </details>
    <details>
      <summary>Règles du jeu</summary>
      <div class="dbody">
        <ol>
          <li>Chacun reçoit en secret une question sur le groupe et désigne un joueur (on peut se désigner soi-même).</li>
          <li>L'imposteur a reçu une question différente, mais il ne le sait pas encore.</li>
          <li>On révèle toutes les réponses. La vraie question reste masquée : affichez-la si vous voulez, ou jouez seulement avec les votes. L'imposteur doit bluffer pour justifier son choix.</li>
          <li>Débat, puis le groupe accuse un seul joueur.</li>
        </ol>
        <p>Quelqu'un a oublié sa question ? Bouton « Revoir ma question » dès qu'il a répondu, jusqu'au vote.</p>
        <p><strong>Taux de ressemblance :</strong> de « très faible » (la question de l'imposteur n'a rien à voir) à « très haut » (presque la même question, on désigne souvent la même personne).</p>
        <p><strong>Points :</strong> imposteur démasqué, chaque innocent marque 1 point. Imposteur qui s'en sort, il marque 2 points.</p>
      </div>
    </details>`;
  },
  pass() {
    const r = S.round, p = r.order[r.idx];
    return `${head("Manche " + r.no)}
    <div class="field"><div class="label">Réponse ${r.idx + 1} sur ${r.order.length}</div>
    <div class="steps">${r.order.map((_, i) => `<i class="${i < r.idx ? "on" : ""}"></i>`).join("")}</div></div>
    <section class="box pass"><div class="label">Passe le téléphone à</div><div class="pass-name">${esc(p)}</div><p class="note">Les autres, regardez ailleurs.</p></section>
    <button class="btn big" data-a="see">C'est moi, voir ma question</button>
    ${r.idx ? `<button class="btn ghost" data-a="peek">Revoir ma question</button>` : ""}
    <button class="btn ghost quiet" data-a="quit">${S.arm === "quit" ? "Confirmer l'abandon de la manche" : "Abandonner la manche"}</button>`;
  },
  question() {
    const r = S.round, p = r.order[r.idx], text = r.imps.includes(p) ? r.q.i : r.q.c;
    return `${head("Confidentiel")}
    <section class="box"><div class="label">${esc(p)} · question ${qno(r.q)}</div><p class="question">${esc(text)}</p></section>
    <section class="field"><div class="label">Ta réponse : un seul nom</div>
      <div class="pick">${S.players.map(n => `<button data-a="sel" data-n="${esc(n)}" aria-pressed="${r.sel === n}">${esc(n)}</button>`).join("")}</div>
    </section>
    <button class="btn big red" data-a="ok" ${r.sel ? "" : "disabled"}>Valider et cacher</button>`;
  },
  done() {
    return `${head("Scellé")}
    <section class="box pass"><div class="label">Tout le monde a répondu</div><p class="lead">Posez le téléphone au milieu de la table.</p></section>
    <button class="btn big red" data-a="reveal">Révéler les réponses</button>
    <button class="btn ghost" data-a="peek">Revoir ma question</button>`;
  },
  reveal() {
    const r = S.round, counts = {};
    r.order.forEach(p => { const a = r.answers[p]; counts[a] = (counts[a] || 0) + 1; });
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]), max = rows[0][1];
    return `${head("Pièces à conviction")}
    ${veiled("La vraie question", `<p class="question">${esc(r.q.c)}</p>`,
      `${r.imps.length > 1 ? "Deux d'entre vous avaient" : "L'un d'entre vous avait"} une autre question. À vous de ${r.imps.length > 1 ? "les" : "le"} démasquer.`)}
    <section class="field"><div class="label">Les réponses</div>
      <div class="answers">${r.order.map(p => `<div class="ans"><span>${esc(p)}</span><span class="arrow">a désigné</span><strong>${esc(r.answers[p])}</strong></div>`).join("")}</div></section>
    <section class="field"><div class="label">Décompte</div>
      <div class="tally">${rows.map(([n, c]) => `<div class="t"><span>${esc(n)}</span><span class="bar"><i style="width:${(c / max) * 100}%"></i></span><span class="num">${c}</span></div>`).join("")}</div></section>
    <section class="box"><div class="label">Temps de débat</div>
      <div class="timer" id="timer">${fmtTimer()}</div>
      <div class="row">${[60, 120, 180].map(s => `<button class="btn ghost" data-a="timer" data-s="${s}">${s / 60} min</button>`).join("")}</div></section>
    <button class="btn big red" data-a="tovote">Passer au vote</button>
    <button class="btn ghost" data-a="peek">Revoir ma question</button>`;
  },
  vote() {
    const r = S.round;
    return `${head("Mise en accusation")}
    <section class="field"><div class="label">Qui ${r.imps.length > 1 ? "est l'un des imposteurs" : "est l'imposteur"} ?</div>
      <p class="note">Mettez-vous d'accord, puis désignez un seul suspect.</p>
      <div class="pick">${S.players.map(n => `<button data-a="acc" data-n="${esc(n)}" aria-pressed="${r.accused === n}">${esc(n)}</button>`).join("")}</div></section>
    <button class="btn big red" data-a="judge" ${r.accused ? "" : "disabled"}>${r.accused ? "Accuser " + esc(r.accused) : "Choisissez un suspect"}</button>
    <button class="btn ghost quiet" data-a="back">Revoir les réponses</button>
    <button class="btn ghost" data-a="peek">Revoir ma question</button>`;
  },
  // « Revoir ma question » : choisir son nom, passer le téléphone, revoir sa question et sa réponse.
  peekpick() {
    const r = S.round;
    return `${head("Trou de mémoire")}
    <section class="field"><div class="label">Qui veut revoir sa question ?</div>
      <div class="pick">${r.order.filter(p => p in r.answers).map(n => `<button data-a="peekp" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div></section>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekpass() {
    return `${head("Trou de mémoire")}
    <section class="box pass"><div class="label">Passe le téléphone à</div><div class="pass-name">${esc(S.round.peek)}</div><p class="note">Les autres, regardez ailleurs.</p></section>
    <button class="btn big" data-a="peeksee">C'est moi, revoir ma question</button>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekq() {
    const r = S.round, p = r.peek;
    return `${head("Confidentiel")}
    <section class="box"><div class="label">${esc(p)} · ta question</div><p class="question">${esc(r.imps.includes(p) ? r.q.i : r.q.c)}</p>
      <p class="note">Tu as désigné <strong>${esc(r.answers[p])}</strong>.</p></section>
    <button class="btn big red" data-a="peekx">J'ai retenu, cacher</button>`;
  },
  result() {
    const r = S.round, caught = r.imps.includes(r.accused), others = r.imps.filter(p => p !== r.accused);
    let line;
    if (caught) line = `${esc(r.accused)} était bien imposteur.` + (others.length ? ` ${esc(others[0])} l'était aussi et s'en tire.` : "");
    else line = `${esc(r.accused)} était innocent. ${r.imps.map(esc).join(" et ")} ${r.imps.length > 1 ? "étaient les imposteurs" : "était l'imposteur"}.`;
    return `${head("Verdict")}
    <div class="verdict-wrap"><div class="verdict">${caught ? "Démasqué" : "Raté"}</div></div>
    <p class="lead center">${line}</p>
    ${veiled("Les questions", `<p class="question sm">${esc(r.q.c)}</p><div class="label">Question de l'imposteur</div><p class="question sm">${esc(r.q.i)}</p>`, "", true)}
    <section class="box"><div class="label">Classement après la manche ${r.no}</div>${scoreList(r.delta)}</section>
    <button class="btn big red" data-a="start">Manche suivante</button>
    <button class="btn ghost" data-a="menu">Retour au menu</button>`;
  }
};

function fmtTimer() {
  if (!S.timerEnd) return "–:––";
  const left = Math.max(0, Math.ceil((S.timerEnd - Date.now()) / 1000));
  return left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Temps écoulé";
}
function startTick() {
  clearInterval(tick);
  tick = setInterval(() => {
    const el = document.getElementById("timer");
    if (!el) return clearInterval(tick);
    el.textContent = fmtTimer();
    if (S.timerEnd && Date.now() >= S.timerEnd) { el.classList.add("done"); clearInterval(tick); fx.sound("alarm"); fx.buzz([80, 60, 80]); }
  }, 250);
}

function render(focusId) {
  clearInterval(tick);
  app.innerHTML = V[S.screen]();
  if (S.screen === "reveal" && S.timerEnd && Date.now() < S.timerEnd) startTick();
  if (S.screen !== lastScreen) {
    window.scrollTo(0, 0); lastScreen = S.screen; fx.enter(app);
    fx.buzz({ question: 15, peekq: 15, reveal: 40, result: [40, 60, 90] }[S.screen]);
    fx.sound(S.screen === "result" ? (S.round.imps.includes(S.round.accused) ? "win" : "fail") : { question: "reveal", peekq: "reveal", reveal: "reveal" }[S.screen]);
  }
  if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
}

async function wake() {
  try { if ("wakeLock" in navigator && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } } catch (e) {}
}

function newRound() {
  const all = pool(); if (S.players.length < 3 || !all.length) return;
  let fresh = all.filter(q => !S.used.includes(q.id));
  if (!fresh.length) { S.used = S.used.filter(id => !all.some(q => q.id === id)); fresh = all; }
  const base = fresh[rand(fresh.length)];
  S.used.push(base.id);
  const q = { id: base.id, p: base.p, c: base.c, i: impostorQuestion(base, all) };
  const players = S.players.slice(), first = S.roundNo % players.length;
  S.roundNo += 1;
  S.round = { q, imps: shuffle(players).slice(0, effImp()), order: players.slice(first).concat(players.slice(0, first)),
    idx: 0, answers: {}, sel: null, accused: null, scored: false, delta: null, no: S.roundNo, showQ: false, anim: false };
  S.screen = "pass"; S.timerEnd = null; S.arm = ""; S.msg = "";
  save(); wake(); render();
}

function scoreRound() {
  const r = S.round; if (r.scored) return;
  const caught = r.imps.includes(r.accused); r.delta = {};
  S.players.forEach(p => {
    const imp = r.imps.includes(p);
    const d = caught ? (!imp ? 1 : p !== r.accused ? 2 : 0) : (imp ? 2 : 0);
    r.delta[p] = d; S.scores[p] = (S.scores[p] || 0) + d;
  });
  r.scored = true; save();
}

app.addEventListener("click", e => {
  const b = e.target.closest("[data-a]"); if (!b || b.disabled) return;
  const a = b.dataset.a, r = S.round;
  if (a !== "reset" && a !== "quit") S.arm = "";
  switch (a) {
    case "rm": S.players.splice(+b.dataset.i, 1); S.example = false; S.msg = ""; save(); return render();
    case "pack": S.packs[b.dataset.k] = !S.packs[b.dataset.k]; save(); return render();
    case "imp": S.nImp = +b.dataset.k; save(); return render();
    case "sim": S.sim = +b.dataset.k; save(); return render();
    case "start": return newRound();
    case "reset":
      if (S.arm === "reset") { S.scores = {}; S.roundNo = 0; S.arm = ""; save(); } else S.arm = "reset";
      return render();
    case "rmc": S.openCustom = true; S.custom = S.custom.filter(c => String(c.id) !== b.dataset.id); S.used = S.used.filter(id => id !== "c" + b.dataset.id); save(); return render();
    case "see": S.screen = "question"; return render();
    case "peek": r.peekBack = S.screen; S.screen = "peekpick"; return render();
    case "peekp": r.peek = b.dataset.n; S.screen = "peekpass"; return render();
    case "peeksee": S.screen = "peekq"; return render();
    case "peekx": r.peek = null; S.screen = r.peekBack || "reveal"; return render();
    case "quit":
      if (S.arm === "quit") { S.arm = ""; S.round = null; S.screen = "setup"; } else S.arm = "quit";
      return render();
    case "sel": r.sel = b.dataset.n; return render();
    case "ok":
      r.answers[r.order[r.idx]] = r.sel; r.sel = null; r.idx += 1;
      S.screen = r.idx < r.order.length ? "pass" : "done"; return render();
    case "reveal": S.screen = "reveal"; return render();
    case "showq": r.showQ = true; r.anim = true; return render();
    case "hideq": r.showQ = false; return render();
    case "timer": S.timerEnd = Date.now() + (+b.dataset.s) * 1000; return render();
    case "tovote": S.screen = "vote"; return render();
    case "back": S.screen = "reveal"; return render();
    case "acc": r.accused = b.dataset.n; return render();
    case "judge": scoreRound(); S.screen = "result"; return render();
    case "menu": S.round = null; S.screen = "setup"; return render();
  }
});

app.addEventListener("toggle", e => {
  if (e.target.id === "customBox") S.openCustom = e.target.open;
  if (e.target.id === "setBox") S.openSet = e.target.open;
}, true);

app.addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target.dataset.form;
  if (f === "add") {
    const v = document.getElementById("newp").value.trim().replace(/\s+/g, " ");
    if (!v) return;
    if (S.example) { S.players = []; S.example = false; }
    if (S.players.some(p => p.toLowerCase() === v.toLowerCase())) { S.msg = `${v} est déjà dans la liste.`; return render("newp"); }
    if (S.players.length >= 12) { S.msg = "12 joueurs maximum."; return render("newp"); }
    S.players.push(v); S.msg = ""; save(); render("newp");
  } else if (f === "custom") {
    const c = document.getElementById("cc").value.trim(), i = document.getElementById("ci").value.trim();
    if (!c || !i) { document.getElementById(c ? "ci" : "cc").focus(); return; }
    S.custom.push({ id: Date.now(), c, i }); save();
    S.openCustom = true; render("cc");
  }
});

function start(data) {
  if (data && data.S) S = data.S;
  else {
    S = defaults();
    const saved = load();
    if (saved) { Object.assign(S, saved); if (!S.sim) S.sim = 4; S.example = false; }
  }
  render();
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
