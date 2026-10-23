// Le Menteur : un thème commun, chacun raconte une vraie anecdote, le menteur en invente une. Vote secret ensuite.
const TPaquets = creerPaquets({
  key: "jeux.paquets-themes.v1", packs: THEME_PACKS, prep: () => ({}), extra: (x, y, s) => s,
  rows: THEMES_DATA.map(([pack, t]) => ({ pack, theme: pack, items: [t], links: [] })),
  labels: { one: "thème", add: "Nouveau thème : Ta pire…", near: "", search: "Rechercher un thème", empty: "Aucun thème pour l'instant.", max: 100 }
});
const KEY = "jeux.menteur.v1";
const app = document.getElementById("app");
let S, lastScreen = null, lock = null, tick = null;

function defaults() {
  return { screen: "setup", players: ["Léa", "Tom", "Sam", "Inès"], example: true, packs: {}, nLiars: 1,
    scores: {}, roundNo: 0, recent: [], r: null, msg: "", arm: "" };
}
function load(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ players: S.players, packs: S.packs, nLiars: S.nLiars, scores: S.scores,
    roundNo: S.roundNo, recent: S.recent, r: S.r, screen: S.screen })); } catch (e) {}
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const isActive = id => S.packs[id] !== false;
const canPlay = () => TPaquets.count(isActive) > 0;
const effLiars = () => (S.players.length >= 6 ? S.nLiars : 1);

// Le classement ne vaut que pour la tablée en cours : il repart de zéro dès que la liste des joueurs change.
function newTable() { S.scores = {}; S.roundNo = 0; }

function head(stamp) {
  const back = S.screen === "setup" ? `<a class="back" href="../../">← Tous les jeux</a>` : "";
  return `<header class="head"><div class="head-l">${back}<div class="brand">Le<br><em>Menteur</em></div></div><div class="head-r">${S.screen === "setup" ? fx.soundButton() : `<div class="stamp">${esc(stamp)}</div>`}</div></header>`;
}
function scoreList(delta) {
  const rows = S.players.map(p => ({ p, s: S.scores[p] || 0, d: delta ? delta[p] || 0 : null })).sort((a, b) => b.s - a.s);
  return `<ol class="scores">${rows.map((x, i) => `<li><span class="rk">${i + 1}</span><span class="nm">${esc(x.p)}</span><span class="dl">${x.d ? "+" + x.d : ""}</span><span class="pt">${x.s} pt${x.s > 1 ? "s" : ""}</span></li>`).join("")}</ol>`;
}
const passBox = (p, note) => `<section class="box pass"><div class="label">Passe le téléphone à</div><div class="pass-name">${esc(p)}</div><p class="note">${note}</p></section>`;
const themeBox = t => `<section class="box theme-card"><div class="label">Le thème</div><p class="theme-txt">${esc(t)}</p></section>`;
function secret(p) {
  const r = S.r, liar = r.liars.includes(p);
  return `${themeBox(r.theme)}
    <section class="box theme-card"><div class="label">${esc(p)} · ton rôle</div>
      <p class="role${liar ? " liar" : ""}">${liar ? "Menteur" : "Vérité"}</p>
      <p class="note">${liar ? "Invente une anecdote crédible sur ce thème. Ne te fais pas griller !" : "Prépare une vraie anecdote sur ce thème. Les détails font la différence."}</p></section>`;
}

const V = {
  setup() {
    const n = S.players.length, canStart = n >= 3 && canPlay();
    return `${head("Atelier")}
    <section class="field">
      <div class="label">Joueurs · ${n}</div>
      <div class="players">${S.players.map((p, i) => `<span class="chip${S.example ? " ex" : ""}"><span>${esc(p)}</span><button data-a="rm" data-i="${i}" aria-label="Retirer ${esc(p)}">×</button></span>`).join("")}</div>
      <form class="row" data-form="add">
        <input id="newp" type="text" maxlength="16" placeholder="Ajouter un joueur" autocomplete="off" aria-label="Prénom du joueur">
        <button class="btn" type="submit" aria-label="Ajouter le joueur" ${n >= 12 ? "disabled" : ""}>+</button>
      </form>
      ${S.msg ? `<p class="err">${esc(S.msg)}</p>` : ""}
    </section>
    <details id="setBox" class="settings" ${S.openSet ? "open" : ""}>
      ${settingsSummary([`${effLiars()} menteur${effLiars() > 1 ? "s" : ""}`])}
      <div class="dbody">
        <section class="field">
          <div class="label">Menteurs</div>
          <div class="seg">${[1, 2].map(k => `<button data-a="liars" data-k="${k}" aria-pressed="${effLiars() === k}" ${k === 2 && n < 6 ? "disabled" : ""}>${k}</button>`).join("")}</div>
          ${n < 6 ? `<p class="note">2 menteurs dès 6 joueurs.</p>` : ""}
        </section>
        <section class="field">
          <div class="label">Paquets</div>
          ${TPaquets.selector(isActive)}
        </section>
      </div>
    </details>
    <button class="btn big red" data-a="start" ${canStart ? "" : "disabled"}>Jouer</button>
    ${n < 3 ? `<p class="note center">Au moins 3 joueurs.</p>` : !canPlay() ? `<p class="note center">Activez au moins un paquet.</p>` : ""}
    <details id="packBox" ${S.openPacks ? "open" : ""}>
      <summary>Paquets</summary>
      <div class="dbody">${TPaquets.manager()}</div>
    </details>
    <details>
      <summary>Règles du jeu</summary>
      <div class="dbody">
        <ol>
          <li>Un thème s'affiche, le même pour tout le monde. En secret, chacun découvre son rôle.</li>
          <li>Chacun raconte à son tour une vraie anecdote sur ce thème. Le menteur, lui, en invente une.</li>
          <li>On pose des questions, on débat, puis chacun vote en secret pour celui qui a menti.</li>
          <li>Le menteur est démasqué s'il reçoit le plus de votes.</li>
        </ol>
        <p><strong>Points :</strong> +1 pour chaque vote qui désigne un menteur. Un menteur qui n'est pas démasqué marque 2 points.</p>
      </div>
    </details>`;
  },
  pass() {
    const r = S.r, p = r.deal[r.idx];
    return `${head("Manche " + r.no)}
    <div class="field"><div class="label">Distribution ${r.idx + 1} sur ${r.deal.length}</div>
      <div class="steps">${r.deal.map((_, i) => `<i class="${i < r.idx ? "on" : ""}"></i>`).join("")}</div></div>
    ${passBox(p, "Les autres, regardez ailleurs.")}
    <button class="btn big" data-a="see">C'est moi, voir mon rôle</button>
    ${r.idx ? `<button class="btn ghost" data-a="peek">Revoir mon rôle</button>` : ""}
    <button class="btn ghost quiet" data-a="quit">${S.arm === "quit" ? "Confirmer l'abandon" : "Abandonner la manche"}</button>`;
  },
  role() {
    return `${head("Top secret")}${secret(S.r.deal[S.r.idx])}
    <button class="btn big red" data-a="hide">J'ai compris, cacher</button>`;
  },
  stories() {
    const r = S.r;
    return `${head("Récits")}
    ${themeBox(r.theme)}
    <section class="box"><div class="label">Ordre de parole</div>
      <p class="note">Chacun raconte son anecdote. Ensuite, posez vos questions.</p>
      <ol class="order">${r.order.map(p => `<li>${esc(p)}</li>`).join("")}</ol></section>
    <section class="box"><div class="label">Temps de débat</div>
      <div class="timer" id="timer">${fmtTimer()}</div>
      <div class="row">${[60, 120, 180].map(s => `<button class="btn ghost" data-a="timer" data-s="${s}">${s / 60} min</button>`).join("")}</div></section>
    <button class="btn big red" data-a="tovote">Passer au vote</button>
    <button class="btn ghost" data-a="peek">Revoir mon rôle</button>
    <button class="btn ghost quiet" data-a="quit">${S.arm === "quit" ? "Confirmer l'abandon" : "Abandonner la manche"}</button>`;
  },
  votepass() {
    const r = S.r, p = r.order[r.vidx];
    return `${head("Vote secret")}
    <div class="field"><div class="label">Vote ${r.vidx + 1} sur ${r.order.length}</div>
      <div class="steps">${r.order.map((_, i) => `<i class="${i < r.vidx ? "on" : ""}"></i>`).join("")}</div></div>
    ${passBox(p, "Les autres, ne regardez pas.")}
    <button class="btn big" data-a="seevote">C'est moi, voter</button>`;
  },
  vote() {
    const r = S.r, p = r.order[r.vidx];
    return `${head("Vote secret")}
    <section class="field"><div class="label">${esc(p)} · qui a menti ${r.liars.length > 1 ? "(un des menteurs)" : ""} ?</div>
      <div class="pick">${S.players.filter(x => x !== p).map(x => `<button data-a="sel" data-n="${esc(x)}" aria-pressed="${r.sel === x}">${esc(x)}</button>`).join("")}</div></section>
    <button class="btn big red" data-a="cast" ${r.sel ? "" : "disabled"}>Valider et cacher</button>`;
  },
  count() {
    return `${head("Dépouillement")}
    <section class="box pass"><div class="label">Tout le monde a voté</div><p class="lead">Posez le téléphone au milieu de la table.</p></section>
    <button class="btn big red" data-a="reveal">Révéler les votes</button>`;
  },
  result() {
    const r = S.r, tally = {};
    Object.values(r.votes).forEach(v => { tally[v] = (tally[v] || 0) + 1; });
    const rows = S.players.map(p => [p, tally[p] || 0]).filter(([, c]) => c).sort((a, b) => b[1] - a[1]), max = rows.length ? rows[0][1] : 1;
    return `${head("Verdict")}
    ${themeBox(r.theme)}
    <div class="liars">${r.liars.map(p => `<div class="verdict-wrap"><div class="verdict">${r.caught.includes(p) ? "Démasqué" : "S'en sort"}</div></div>
      <p class="lead center"><strong>${esc(p)}</strong> était ${r.liars.length > 1 ? "un des menteurs" : "le menteur"}.</p>`).join("")}</div>
    <section class="field"><div class="label">Les votes</div>
      <div class="tally">${rows.map(([p, c]) => `<div class="t${r.liars.includes(p) ? " liar" : ""}"><span>${esc(p)}</span><span class="bar"><i style="width:${(c / max) * 100}%"></i></span><span class="num">${c}</span></div>`).join("")}</div></section>
    <section class="field"><div class="label">Qui a voté qui</div>
      <div class="answers">${r.order.map(p => `<div class="ans${r.liars.includes(r.votes[p]) ? " imp" : ""}"><span>${esc(p)}</span><strong>${esc(r.votes[p])}</strong></div>`).join("")}</div></section>
    <section class="box"><div class="label">Classement après la manche ${r.no}</div>${scoreList(r.delta)}</section>
    <button class="btn big red" data-a="start">Manche suivante</button>
    <button class="btn ghost" data-a="menu">Retour au menu</button>`;
  },
  peekpick() {
    const r = S.r, who = r.peekBack === "pass" ? r.deal.slice(0, r.idx) : S.players;
    return `${head("Trou de mémoire")}
    <section class="field"><div class="label">Qui veut revoir son rôle ?</div>
      <div class="pick">${who.map(n => `<button data-a="peekp" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div></section>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekpass() {
    return `${head("Trou de mémoire")}${passBox(S.r.peek, "Les autres, regardez ailleurs.")}
    <button class="btn big" data-a="peeksee">C'est moi, revoir mon rôle</button>
    <button class="btn ghost quiet" data-a="peekx">Annuler</button>`;
  },
  peekrole() {
    return `${head("Top secret")}${secret(S.r.peek)}
    <button class="btn big red" data-a="peekx">J'ai compris, cacher</button>`;
  }
};

function fmtTimer() {
  const end = S.r && S.r.timerEnd;
  if (!end) return "–:––";
  const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
  return left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Temps écoulé";
}
function startTick() {
  clearInterval(tick);
  tick = setInterval(() => {
    const el = document.getElementById("timer");
    if (!el) return clearInterval(tick);
    el.textContent = fmtTimer();
    if (Date.now() >= S.r.timerEnd) { el.classList.add("done"); clearInterval(tick); fx.sound("alarm"); fx.buzz([80, 60, 80]); }
  }, 250);
}

function render(focusId) {
  clearInterval(tick);
  app.innerHTML = V[S.screen]();
  if (S.screen === "stories" && S.r.timerEnd && Date.now() < S.r.timerEnd) startTick();
  if (S.screen !== lastScreen) {
    window.scrollTo(0, 0); lastScreen = S.screen; fx.enter(app);
    fx.buzz({ role: 15, peekrole: 15, result: [40, 60, 90] }[S.screen]);
    fx.sound(S.screen === "result" ? (S.r.caught.length ? "win" : "fail") : { role: "reveal", peekrole: "reveal" }[S.screen]);
  }
  if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
  save();
}

async function wake() {
  try { if ("wakeLock" in navigator && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } } catch (e) {}
}

function newRound() {
  if (S.players.length < 3 || !canPlay()) return;
  const t = TPaquets.draw(isActive, S.recent || []); if (!t) return;
  S.recent = [t.n].concat(S.recent || []).slice(0, 40);
  const players = S.players.slice(), first = S.roundNo % players.length;
  S.roundNo += 1;
  S.r = { no: S.roundNo, theme: t.w, liars: shuffle(players).slice(0, effLiars()), deal: players.slice(first).concat(players.slice(0, first)), idx: 0,
    order: shuffle(players), vidx: 0, votes: {}, sel: null, caught: [], delta: null, scored: false, timerEnd: null, peek: null, peekBack: null };
  S.screen = "pass"; S.arm = ""; S.msg = "";
  wake(); render();
}

// Démasqué = parmi les plus votés. Points : +1 par vote juste, +2 au menteur qui s'en sort.
function scoreRound() {
  const r = S.r; if (r.scored) return;
  const tally = {};
  Object.values(r.votes).forEach(v => { tally[v] = (tally[v] || 0) + 1; });
  const max = Math.max(0, ...Object.values(tally));
  r.caught = r.liars.filter(p => max > 0 && tally[p] === max);
  r.delta = {};
  S.players.forEach(p => {
    const d = (r.liars.includes(r.votes[p]) ? 1 : 0) + (r.liars.includes(p) && !r.caught.includes(p) ? 2 : 0);
    r.delta[p] = d; S.scores[p] = (S.scores[p] || 0) + d;
  });
  r.scored = true;
}

app.addEventListener("click", e => {
  const pk = e.target.closest("[data-pk]");
  if (pk) { if (TPaquets.handle(pk)) render(); return; }
  const b = e.target.closest("[data-a]"); if (!b || b.disabled) return;
  const a = b.dataset.a, r = S.r;
  if (a !== "quit") S.arm = "";
  switch (a) {
    case "rm": S.players.splice(+b.dataset.i, 1); S.example = false; S.msg = ""; newTable(); return render();
    case "liars": S.nLiars = +b.dataset.k; return render();
    case "pack": S.packs[b.dataset.k] = !isActive(b.dataset.k); return render();
    case "start": return newRound();
    case "quit": if (S.arm === "quit") { S.arm = ""; S.r = null; S.screen = "setup"; } else S.arm = "quit"; return render();
    case "see": S.screen = "role"; return render();
    case "hide": r.idx += 1; S.screen = r.idx < r.deal.length ? "pass" : "stories"; return render();
    case "timer": r.timerEnd = Date.now() + (+b.dataset.s) * 1000; return render();
    case "tovote": S.screen = "votepass"; return render();
    case "seevote": S.screen = "vote"; return render();
    case "sel": r.sel = b.dataset.n; return render();
    case "cast":
      r.votes[r.order[r.vidx]] = r.sel; r.sel = null; r.vidx += 1;
      S.screen = r.vidx < r.order.length ? "votepass" : "count"; return render();
    case "reveal": scoreRound(); S.screen = "result"; return render();
    case "menu": S.r = null; S.screen = "setup"; return render();
    case "peek": r.peekBack = S.screen; S.screen = "peekpick"; return render();
    case "peekp": r.peek = b.dataset.n; S.screen = "peekpass"; return render();
    case "peeksee": S.screen = "peekrole"; return render();
    case "peekx": r.peek = null; S.screen = r.peekBack || "stories"; return render();
  }
});

app.addEventListener("toggle", e => {
  if (e.target.id === "setBox") S.openSet = e.target.open;
  if (e.target.id === "packBox") S.openPacks = e.target.open;
}, true);

app.addEventListener("submit", e => {
  e.preventDefault();
  const focus = TPaquets.submit(e.target);
  if (focus) return render(focus);
  if (e.target.dataset.form !== "add") return;
  const v = document.getElementById("newp").value.trim().replace(/\s+/g, " ");
  if (!v) return;
  if (S.example) { S.players = []; S.example = false; }
  if (S.players.some(p => p.toLowerCase() === v.toLowerCase())) { S.msg = `${v} est déjà dans la liste.`; return render("newp"); }
  if (S.players.length >= 12) { S.msg = "12 joueurs maximum."; return render("newp"); }
  S.players.push(v); S.msg = ""; newTable(); render("newp");
});

function start(data) {
  if (data && data.S) S = data.S;
  else {
    S = defaults();
    const saved = load(KEY);
    if (saved) { Object.assign(S, saved); S.example = false; }
    else {
      // Première visite : reprend les joueurs d'un autre jeu s'il y en a.
      for (const k of ["jeux.undercover.v1", "jeux.quiz-undercover.v1"]) {
        const o = load(k);
        if (o && o.players && o.players.length) { S.players = o.players.slice(0, 12); S.example = false; break; }
      }
    }
    // Ne jamais rouvrir l'application sur un rôle ou un vote affiché.
    if (!S.r) S.screen = "setup";
    else if (S.screen === "role") S.screen = "pass";
    else if (S.screen === "vote") S.screen = "votepass";
    else if (S.screen === "peekrole" || S.screen === "peekpass") S.screen = "peekpick";
  }
  render();
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
