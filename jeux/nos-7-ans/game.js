const KEY = "jeux.nos-7-ans.v1";
const ROUNDS = 7;
const app = document.getElementById("app");
const HEART = "M12 21C12 21 3 15.5 3 9.5 3 6.5 5.3 4.5 8 4.5c1.7 0 3.1.9 4 2.2.9-1.3 2.3-2.2 4-2.2 2.7 0 5 2 5 5 0 6-9 11.5-9 11.5z";
const heart = (cls = "") => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="${HEART}"/></svg>`;
let S, lastScreen = null;

function defaults() { return { screen: "home", names: ["Alex", "Betti"], best: null, played: 0, game: null }; }
function load() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify({ names: S.names, best: S.best, played: S.played })); } catch (e) {} }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = n => Math.floor(Math.random() * n);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Illustration d'accueil : deux cœurs enlacés autour d'un 7.
const HERO = `<svg viewBox="0 0 240 200" role="img" aria-label="Deux cœurs enlacés et le chiffre 7">
  <g transform="translate(14 18) scale(6.2)"><path d="${HEART}" fill="var(--mark)"/></g>
  <g transform="translate(78 22) scale(6.2)"><path d="${HEART}" fill="var(--stamp)" opacity=".92"/></g>
  <text x="128" y="132" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="800" font-size="92" fill="#FFFFFF">7</text>
  <g fill="var(--stamp)"><path d="M28 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M214 150l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><circle cx="210" cy="38" r="4"/><circle cx="36" cy="168" r="3"/></g>
</svg>`;

function progress() {
  const g = S.game;
  return `<div class="hearts" aria-label="Question ${g.idx + 1} sur ${ROUNDS}">${g.qs.map((_, i) => heart(i < g.results.length ? (g.results[i] ? "yes" : "no") : i === g.idx ? "now" : "")).join("")}</div>`;
}
const back = () => `<a class="back" href="../../">← Tous les jeux</a>`;
const who = k => (k === "both" ? "Nous deux" : S.names[k]);

const V = {
  home() {
    const [a, b] = S.names;
    return `${back()}
    <section class="hero">${HERO}
      <h1 class="title">Nos <em>7 ans</em></h1>
      <p class="names"><b>${esc(a)}</b> &amp; <b>${esc(b)}</b></p>
    </section>
    <p class="lead center">Sept questions, une pour chaque année. Chacun répond en cachette : êtes-vous sur la même longueur d'onde ?</p>
    <button class="btn big red" data-a="start">Commencer</button>
    ${S.best !== null ? `<p class="note center">Votre plus beau score : ${S.best} cœur${S.best > 1 ? "s" : ""} sur ${ROUNDS} · ${S.played} partie${S.played > 1 ? "s" : ""} jouée${S.played > 1 ? "s" : ""}</p>` : ""}
    <details>
      <summary>Comment jouer</summary>
      <div class="dbody"><ol>
        <li>Une question s'affiche : « Qui de nous deux… ? ».</li>
        <li>${esc(a)} répond en cachette (${esc(a)}, ${esc(b)} ou nous deux), puis passe le téléphone à ${esc(b)}.</li>
        <li>On découvre les deux réponses : si elles sont pareilles, un cœur se remplit.</li>
        <li>Après sept questions, on compte les cœurs… et on en discute autour d'un verre.</li>
      </ol></div>
    </details>
    <details>
      <summary>Vos prénoms</summary>
      <div class="dbody"><form class="names-form" data-form="names">
        <input id="n0" type="text" maxlength="14" value="${esc(a)}" aria-label="Premier prénom">
        <input id="n1" type="text" maxlength="14" value="${esc(b)}" aria-label="Second prénom">
        <button class="btn ghost" type="submit">Enregistrer</button>
      </form></div>
    </details>`;
  },
  turn() {
    const g = S.game, p = g.order[g.step];
    return `${progress()}
    <section class="box card"><div class="label">Question ${g.idx + 1} sur ${ROUNDS}</div>
      <p class="qwho">Au tour de</p><div class="turn">${esc(S.names[p])}</div>
      <p class="note">${g.step ? `${esc(S.names[g.order[0]])} a répondu. ` : ""}${esc(S.names[1 - p])}, ne regarde pas&nbsp;!</p></section>
    <button class="btn big red" data-a="see">C'est moi, voir la question</button>`;
  },
  ask() {
    const g = S.game, p = g.order[g.step];
    return `${progress()}
    <section class="box card"><div class="label">${esc(S.names[p])} · en cachette</div>
      <p class="qwho">Qui de nous deux…</p><p class="qtext">${esc(g.qs[g.idx])}</p></section>
    <div class="choices">
      ${[0, 1].map(k => `<button data-a="pick" data-k="${k}" aria-pressed="${g.sel === k}">${heart()}${esc(S.names[k])}</button>`).join("")}
      <button class="both" data-a="pick" data-k="both" aria-pressed="${g.sel === "both"}">${heart()}Nous deux</button>
    </div>
    <button class="btn big red" data-a="ok" ${g.sel === null ? "disabled" : ""}>Valider et cacher</button>`;
  },
  reveal() {
    const g = S.game, ans = g.answers, same = ans[0] === ans[1], last = g.idx + 1 >= ROUNDS;
    return `${progress()}
    <section class="box card"><p class="qwho">Qui de nous deux…</p><p class="qtext">${esc(g.qs[g.idx])}</p></section>
    <div class="${same ? "match" : ""}"><div class="duo">${[0, 1].map(k => `<div><small>${esc(S.names[k])} a répondu</small><strong>${esc(who(ans[k]))}</strong></div>`).join("")}</div></div>
    <div class="verdict ${same ? "" : "no"}">${heart()}<p>${same ? "Même réponse !" : "Pas d'accord…"}</p><span>${same ? "Un cœur de plus." : "À vous de vous expliquer."}</span></div>
    <button class="btn big red" data-a="next">${last ? "Voir notre score" : "Question suivante"}</button>`;
  },
  end() {
    const g = S.game, n = g.results.filter(Boolean).length, [a, b] = S.names;
    const msg = n === ROUNDS ? "Sept sur sept, comme vos sept ans. Âmes sœurs certifiées."
      : n >= 5 ? "Presque télépathes. Sept ans, ça se voit."
      : n >= 3 ? "De quoi débattre gentiment au dîner."
      : "Après sept ans, il reste encore des mystères à découvrir. C'est plutôt bon signe.";
    return `<div class="rain" aria-hidden="true">${Array.from({ length: 28 }, () => `<i style="left:${rand(100)}%;--s:${14 + rand(20)}px;--d:${3 + Math.random() * 3}s;--w:${Math.random() * 2}s;--r:${rand(360)}deg">${heart()}</i>`).join("")}</div>
    <section class="hero"><p class="label">Votre score</p></section>
    <p class="score">${n}<small> / ${ROUNDS}</small></p>
    ${progress()}
    <section class="box card">
      <p class="letter">${msg}</p>
      <p class="letter">Joyeux anniversaire, à vous deux.</p>
      <p class="sign">${esc(a)} &amp; ${esc(b)} · 7 ans</p>
    </section>
    <button class="btn big red" data-a="start">Rejouer avec d'autres questions</button>
    <button class="btn ghost" data-a="home">Retour</button>`;
  }
};

function render(focusId) {
  app.innerHTML = V[S.screen]();
  if (S.screen !== lastScreen) { window.scrollTo(0, 0); lastScreen = S.screen; }
  if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
}

function startGame() {
  const first = rand(2);
  S.game = { qs: shuffle(QUESTIONS).slice(0, ROUNDS), idx: 0, step: 0, order: [first, 1 - first], answers: [null, null], sel: null, results: [] };
  S.screen = "turn"; render();
}

app.addEventListener("click", e => {
  const b = e.target.closest("[data-a]"); if (!b || b.disabled) return;
  const g = S.game;
  switch (b.dataset.a) {
    case "start": return startGame();
    case "home": S.screen = "home"; S.game = null; return render();
    case "see": S.screen = "ask"; return render();
    case "pick": g.sel = b.dataset.k === "both" ? "both" : +b.dataset.k; return render();
    case "ok":
      g.answers[g.order[g.step]] = g.sel; g.sel = null; g.step += 1;
      if (g.step < 2) { S.screen = "turn"; return render(); }
      g.results.push(g.answers[0] === g.answers[1]); S.screen = "reveal"; return render();
    case "next":
      if (g.idx + 1 >= ROUNDS) {
        const n = g.results.filter(Boolean).length;
        S.best = S.best === null ? n : Math.max(S.best, n); S.played += 1; save();
        S.screen = "end"; return render();
      }
      g.idx += 1; g.step = 0; g.order.reverse(); g.answers = [null, null]; S.screen = "turn"; return render();
  }
});

app.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.dataset.form !== "names") return;
  const v = [0, 1].map(i => document.getElementById("n" + i).value.trim().replace(/\s+/g, " "));
  S.names = v.map((x, i) => x || defaults().names[i]); save(); render();
});

// Cœurs qui flottent doucement en arrière-plan.
document.querySelector(".float").innerHTML = Array.from({ length: 14 }, () =>
  `<i style="left:${rand(100)}%;--s:${12 + rand(22)}px;--d:${9 + rand(9)}s;--w:-${rand(14)}s">${heart()}</i>`).join("");

function start(data) {
  if (data && data.S) S = data.S;
  else { S = defaults(); const saved = load(); if (saved) Object.assign(S, saved); }
  render();
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
