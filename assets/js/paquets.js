// Paquets partagés : mots (Undercover, Undercover Dessin) et questions (Quiz Undercover).
// Paquets intégrés + paquets perso, éléments ajoutés ou supprimés. Les éléments ne vont plus forcément par paires :
// la proximité entre deux éléments est calculée (liens connus de la banque, thème, paquet, puis orthographe et son
// pour les mots, ou mots en commun pour les questions) et comparée au taux de ressemblance choisi.
// Score de proximité (0 à 1) attendu pour chaque niveau de ressemblance (1 très faible … 5 très haut).
const PAQ_BANDS = { 1: [0, .2], 2: [.3, .5], 3: [.5, .68], 4: [.68, .88], 5: [.88, 2] };
const paqNorm = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// cfg : key (localStorage), packs ({ id: nom }), rows ([{ pack, theme, items: [textes], links: [[a, b, niveau]] }]),
// themes ({ thème: libellé }), prep(texte) → champs utiles au score, extra(x, y, score) → score ajusté, labels (textes de l'interface).
// Un lien de niveau 2 marque deux éléments éloignés exprès (par exemple une question et son contraire).
function creerPaquets(cfg) {
  const KEY = cfg.key, PACKS = cfg.packs, THEMES = cfg.themes || {}, L = cfg.labels, BANDS = PAQ_BANDS;
  const LINK = { 2: .4, 3: .6, 4: .8, 5: .95 };
  const ui = { open: null, confirm: null, more: false };
  let D = load(), cache = null;

  function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && d.packs) return d; } catch (e) {} return { packs: [], words: [], hidden: {} }; }
  function save() { cache = null; try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rand = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = paqNorm;

  const builtins = () => Object.entries(PACKS).map(([id, name]) => ({ id, name, builtin: true }));
  const allPacks = () => builtins().concat(D.packs.map(p => ({ id: p.id, name: p.name, builtin: false })));
  const packName = id => (allPacks().find(p => p.id === id) || {}).name || "Perso";
  const themeLabel = t => (t && t.startsWith("pack:") ? packName(t.slice(5)) : THEMES[t] || PACKS[t] || cfg.otherTheme || "Perso");

  // Construit la liste des mots jouables (paquets actifs) et le réseau des proximités connues.
  function build(isActive) {
    const key = allPacks().map(p => (isActive(p.id) ? 1 : 0)).join("");
    if (cache && cache.key === key) return cache;
    const links = new Map(), themeOf = new Map(), items = [], seen = new Set();
    const link = (a, b, l) => { for (const [x, y] of [[a, b], [b, a]]) { if (!links.has(x)) links.set(x, new Map()); links.get(x).set(y, Math.max(l, links.get(x).get(y) || 0)); } };
    const add = (w, pack, theme) => {
      const n = norm(w), k = pack + "|" + n;
      if (!n || seen.has(k) || (D.hidden[pack] || []).includes(n)) return;
      seen.add(k); items.push(Object.assign({ w, n, base: n.replace(/(s|x)$/, ""), pack, theme }, cfg.prep(w)));
    };
    for (const r of cfg.rows) {
      for (const [a, b, lvl] of r.links) link(norm(a), norm(b), lvl);
      for (const w of r.items) if (!themeOf.has(norm(w))) themeOf.set(norm(w), r.theme);
    }
    for (const r of cfg.rows) if (isActive(r.pack)) for (const w of r.items) add(w, r.pack, r.theme);
    for (const c of D.words) {
      if (c.near) link(norm(c.w), norm(c.near), 4);
      if (isActive(c.pack)) add(c.w, c.pack, themeOf.get(norm(c.w)) || (c.near && themeOf.get(norm(c.near))) || "pack:" + c.pack);
    }
    return (cache = { key, items, links });
  }
  function score(x, y, links) {
    const l = (links.get(x.n) || new Map()).get(y.n);
    if (l === 2) return LINK[2];
    let s = LINK[l] || 0;
    if (x.theme === y.theme) s = Math.max(s, .38); else if (x.pack === y.pack) s = Math.max(s, .14);
    return l ? s : cfg.extra(x, y, s);
  }

  // Tire deux mots dont la proximité correspond au niveau demandé (ou au plus proche possible).
  function pick(isActive, level, recent = []) {
    const { items, links } = build(isActive);
    if (items.length < 2) return null;
    const order = [0, 1, -1, 2, -2, 3, -3, 4, -4].map(d => level + d).filter(l => l >= 1 && l <= 5);
    for (const lvl of order) {
      const [lo, hi] = BANDS[lvl];
      const anchors = shuffle(items).sort((a, b) => recent.includes(a.n) - recent.includes(b.n)).slice(0, 90);
      for (const x of anchors) {
        // En repli depuis un niveau moyen ou plus, jamais de contraire (score exactement égal à celui d'un lien de niveau 2).
        const avoidOpp = level >= 3 && lvl <= 2;
        const c = items.filter(y => y.base !== x.base && (s => s >= lo && s < hi && !(avoidOpp && s === LINK[2]))(score(x, y, links)));
        if (!c.length) continue;
        const fresh = c.filter(y => !recent.includes(y.n)), y = (fresh.length ? fresh : c)[rand((fresh.length ? fresh : c).length)];
        return { a: x.w, b: y.w, na: x.n, nb: y.n, theme: x.theme, themeB: y.theme, level: lvl };
      }
    }
    return null;
  }
  const count = isActive => build(isActive).items.length;
  // Tire un seul élément (par exemple un thème), en évitant les plus récents.
  function draw(isActive, recent = []) {
    const { items } = build(isActive);
    if (!items.length) return null;
    const fresh = items.filter(i => !recent.includes(i.n)), from = fresh.length ? fresh : items, x = from[rand(from.length)];
    return { w: x.w, n: x.n, pack: x.pack };
  }

  function wordsOf(id) {
    const hidden = D.hidden[id] || [], out = [], seen = new Set();
    for (const r of cfg.rows) if (r.pack === id) for (const w of r.items) { const n = norm(w); if (!seen.has(n) && !hidden.includes(n)) { seen.add(n); out.push({ w, n, src: "b" }); } }
    for (const c of D.words) if (c.pack === id) { const n = norm(c.w); if (!seen.has(n)) { seen.add(n); out.push({ w: c.w, n, src: "c", id: c.id }); } }
    return out.sort((a, b) => a.n.localeCompare(b.n, "fr"));
  }
  function addWord(pack, w, near) {
    const has = x => wordsOf(pack).some(o => o.n === norm(x));
    if (!has(w)) D.words.push({ id: Date.now() + "" + rand(1000), pack, w, near: near || "" });
    else if (near) { const c = D.words.find(o => o.pack === pack && norm(o.w) === norm(w)); if (c) c.near = near; else D.words.push({ id: Date.now() + "n", pack, w, near }); }
    if (near && !has(near)) D.words.push({ id: Date.now() + "" + rand(1000) + "b", pack, w: near, near: w });
    if (D.hidden[pack]) D.hidden[pack] = D.hidden[pack].filter(n => n !== norm(w) && n !== norm(near || ""));
    save();
  }
  function newPack(name) { const id = "p" + Date.now().toString(36); D.packs.push({ id, name }); save(); return id; }
  // Ancien format (« paires perso » de l'Undercover) : regroupées dans un paquet « Perso ».
  function importPairs(name, pairs) {
    if (!pairs.length) return;
    const id = (D.packs.find(p => p.name === name) || {}).id || newPack(name);
    for (const [a, b] of pairs) addWord(id, a, b);
  }

  // Ligne « Paquets » des réglages : 3 paquets visibles et « … » pour tout afficher.
  function selector(isActive) {
    const packs = allPacks(), many = packs.length > 4, show = many && !ui.more ? packs.slice(0, 3) : packs;
    return `<div class="seg">${show.map(p => `<button data-a="pack" data-k="${esc(p.id)}" aria-pressed="${isActive(p.id)}">${esc(p.name)}</button>`).join("")}${many
      ? `<button data-pk="more" aria-expanded="${ui.more}">${ui.more ? "Moins" : `… +${packs.length - 3}`}</button>` : ""}</div>`;
  }

  // Conteneur « Paquets » : liste des paquets, ou contenu d'un paquet ouvert.
  function manager() {
    const p = ui.open && allPacks().find(x => x.id === ui.open);
    if (!p) {
      return `<ul class="pk-list">${allPacks().map(x => `<li><button data-pk="open" data-id="${esc(x.id)}"><span>${esc(x.name)}</span>${x.builtin ? "" : `<small>perso</small>`}<i aria-hidden="true">›</i></button></li>`).join("")}</ul>
        <form class="row" data-form="pk-new"><input id="pkname" type="text" maxlength="24" placeholder="Nouveau paquet" autocomplete="off" aria-label="Nom du nouveau paquet"><button class="btn" type="submit">Créer</button></form>`;
    }
    const words = wordsOf(p.id), hidden = (D.hidden[p.id] || []).length;
    return `<div class="pk-head"><button class="pk-back" data-pk="back">← Paquets</button><strong>${esc(p.name)}</strong></div>
      <form class="pk-add" data-form="pk-add">
        <input id="pkw" type="text" maxlength="${L.max}" placeholder="${L.add}" autocomplete="off" aria-label="${L.add}">
        ${L.near ? `<input id="pkn" type="text" maxlength="${L.max}" placeholder="${L.near}" autocomplete="off" aria-label="${L.near}">` : ""}
        <button class="btn" type="submit">Ajouter</button>
      </form>
      ${words.length > 20 ? `<input type="search" data-pk-search placeholder="${L.search}" aria-label="${L.search}">` : ""}
      <div class="players pk-words">${words.map(w => `<span class="chip" data-n="${esc(w.n)}"><span>${esc(w.w)}</span><button data-pk="del" data-n="${esc(w.n)}" data-id="${esc(w.id || "")}" aria-label="Supprimer ${esc(w.w)}">×</button></span>`).join("") || `<p class="note">${L.empty}</p>`}</div>
      ${p.builtin && hidden ? `<button class="btn ghost quiet" data-pk="restore">Rétablir ${hidden} ${L.one}${hidden > 1 ? "s" : ""} supprimé${hidden > 1 ? "s" : ""}</button>` : ""}
      ${p.builtin ? "" : `<button class="btn ghost quiet" data-pk="drop">${ui.confirm === "drop" ? "Confirmer la suppression du paquet" : "Supprimer ce paquet"}</button>`}`;
  }
  // Clics sur les boutons data-pk ; renvoie true si l'écran doit être redessiné.
  function handle(b) {
    const a = b.dataset.pk;
    if (a !== "drop") ui.confirm = null;
    if (a === "more") ui.more = !ui.more;
    else if (a === "open") ui.open = b.dataset.id;
    else if (a === "back") ui.open = null;
    else if (a === "del") {
      if (b.dataset.id) D.words = D.words.filter(c => c.id !== b.dataset.id);
      else (D.hidden[ui.open] = D.hidden[ui.open] || []).push(b.dataset.n);
      save();
    } else if (a === "restore") { delete D.hidden[ui.open]; save(); }
    else if (a === "drop") {
      if (ui.confirm !== "drop") ui.confirm = "drop";
      else { D.packs = D.packs.filter(p => p.id !== ui.open); D.words = D.words.filter(c => c.pack !== ui.open); ui.open = null; ui.confirm = null; save(); }
    } else return false;
    return true;
  }
  // Formulaires du conteneur ; renvoie l'id du champ à refocaliser, ou null si le formulaire n'est pas géré ici.
  function submit(form) {
    const f = form.dataset.form, val = id => ((document.getElementById(id) || {}).value || "").trim().replace(/\s+/g, " ");
    if (f === "pk-new") { const name = val("pkname"); if (!name) return "pkname"; ui.open = newPack(name); return "pkw"; }
    if (f === "pk-add") { const w = val("pkw"), n = val("pkn"); if (!w) return "pkw"; addWord(ui.open, w, n); return "pkw"; }
    return null;
  }
  // Recherche dans un paquet ouvert : filtre les mots affichés sans redessiner l'écran.
  document.addEventListener("input", e => {
    if (!e.target.matches("[data-pk-search]")) return;
    const q = norm(e.target.value);
    document.querySelectorAll(".pk-words .chip").forEach(c => { c.hidden = !!q && !c.dataset.n.includes(q); });
  });

  return { pick, draw, count, selector, manager, handle, submit, importPairs, themeLabel, norm, ui };
}

// Proximité orthographique et sonore entre deux mots (« Macron » et « Macaron »).
const paqMots = (() => {
  // Prononciation approximative du français, pour rapprocher les mots qui se ressemblent à l'oreille.
  function phon(s) {
    let t = paqNorm(s).replace(/ /g, "");
    for (const [a, b] of [[/ph/g, "f"], [/qu/g, "k"], [/c(?=[eiy])/g, "s"], [/g(?=[eiy])/g, "j"], [/c/g, "k"], [/eau|au/g, "o"],
      [/(ai|ei|i)n(?=[^aeiouy]|$)/g, "1"], [/[ae][nm](?=[^aeiouy]|$)/g, "2"], [/o[nm](?=[^aeiouy]|$)/g, "3"], [/ai|ei|ey/g, "e"],
      [/y/g, "i"], [/h/g, ""], [/(.)\1+/g, "$1"], [/[estdxp]+$/, ""]]) t = t.replace(a, b);
    return t;
  }
  function lev(a, b) {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  const likeness = (a, b) => (a && b ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0);
  const bound = (a, b) => 1 - Math.abs(a.length - b.length) / Math.max(a.length, b.length, 1);
  return {
    prep: w => ({ ph: phon(w) }),
    // Comparaison d'orthographe seulement si les longueurs permettent d'atteindre le seuil (beaucoup plus rapide).
    extra(x, y, s) {
      if (bound(x.n, y.n) < .72 && bound(x.ph, y.ph) < .72) return s;
      let o = Math.max(likeness(x.n, y.n), likeness(x.ph, y.ph));
      if (Math.min(x.n.length, y.n.length) < 4) o *= .75;
      return o >= .72 ? Math.max(s, .55 + (o - .72) / .28 * .37) : s;
    }
  };
})();

// Paquets de mots (Undercover, Undercover Dessin), si la banque de mots est chargée sur la page.
const Paquets = typeof W === "undefined" ? null : creerPaquets({
  key: "jeux.paquets.v1", packs: PACKS, prep: paqMots.prep, extra: paqMots.extra, otherTheme: "Culture pop",
  rows: W.map(([pack, theme, a, b, lvl]) => ({ pack, theme, items: [a, b], links: [[a, b, lvl]] })),
  themes: { nourriture: "Nourriture", animaux: "Animaux", maison: "Maison", vetements: "Vêtements", techno: "Technologie", lieux: "Lieux",
    loisirs: "Loisirs", metiers: "Métiers", nature: "Nature", transports: "Transports", "musique-ecole": "Musique et école", imaginaire: "Imaginaire", soiree: "Soirée" },
  labels: { one: "mot", add: "Nouveau mot", near: "Mot proche (facultatif)", search: "Rechercher un mot", empty: "Aucun mot pour l'instant.", max: 30 }
});

// Proximité entre deux questions : mots importants en commun ; une question et son contraire restent éloignées.
const paqQuestions = (() => {
  const STOP = new Set("qui le la les l un une des de du d a au aux en et ou se s sa son ses sur dans pour par est sont serait ferait aurait il elle que qu ne n y avec chez tout toute tous leur lui on ce cet cette ces fait faire etre avoir".split(" "));
  // Marqueurs de sens opposé, par famille : un signe différent dans la même famille = contraire.
  const MARK = { premier: ["rang", 1], premiere: ["rang", 1], dernier: ["rang", -1], derniere: ["rang", -1],
    meilleur: ["qual", 1], meilleure: ["qual", 1], meilleurs: ["qual", 1], mieux: ["qual", 1], bien: ["qual", 1], pire: ["qual", -1], pires: ["qual", -1], mal: ["qual", -1],
    plus: ["deg", 1], moins: ["deg", -1], toujours: ["freq", 1], jamais: ["freq", -1], pas: ["neg", -1], rien: ["neg", -1], aucun: ["neg", -1], aucune: ["neg", -1] };
  const ANTI = [["surviv", "mour"], ["gagn", "perd"], ["arriv", "part"], ["fidel", "tromp"], ["riche", "pauvr"], ["entre", "sort"], ["commen", "fini"], ["herit", "mecha"], ["heros", "mecha"]];
  function prep(w) {
    const toks = paqNorm(w).split(" "), marks = {}, stems = new Set();
    for (const t of toks) {
      if (MARK[t]) { const [f, v] = MARK[t]; marks[f] = v; continue; }
      if (STOP.has(t) || t.length < 3) continue;
      stems.add(t.slice(0, 5));
    }
    return { stems, marks };
  }
  function opposite(x, y) {
    for (const f of ["rang", "qual", "deg", "freq"]) if (x.marks[f] && y.marks[f] && x.marks[f] !== y.marks[f]) return true;
    if (!!x.marks.neg !== !!y.marks.neg) return true;
    const has = (q, a) => [...q.stems].some(s => s.startsWith(a));
    return ANTI.some(([a, b]) => (has(x, a) && has(y, b)) || (has(x, b) && has(y, a)));
  }
  return {
    prep,
    extra(x, y, s) {
      let inter = 0; for (const t of x.stems) if (y.stems.has(t)) inter++;
      const j = inter / Math.max(1, x.stems.size + y.stems.size - inter);
      if (j < .3) return s;
      if (opposite(x, y)) return .4;
      return j >= .45 ? Math.max(s, .5 + (j - .45) * .8) : s;
    }
  };
})();

// Paquets de questions (Quiz Undercover), si la banque de questions est chargée sur la page.
const QPaquets = typeof Q === "undefined" ? null : creerPaquets({
  key: "jeux.paquets-questions.v1", packs: PACKS, prep: paqQuestions.prep, extra: paqQuestions.extra,
  rows: Q.map(([pack, c, v5, v4, v3, opp]) => ({ pack, theme: pack, items: [c, v5, v4, v3, opp].filter(Boolean),
    links: [[c, v5, 5], [c, v4, 4], [c, v3, 3], [c, opp, 2]].filter(l => l[1]) })),
  labels: { one: "question", add: "Nouvelle question : Qui… ?", near: "Question proche (facultatif)", search: "Rechercher une question", empty: "Aucune question pour l'instant.", max: 120 }
});
